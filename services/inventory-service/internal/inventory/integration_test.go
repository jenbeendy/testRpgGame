//go:build integration

package inventory

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-chi/chi/v5"
	_ "github.com/lib/pq"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

var testDB *sql.DB

func TestMain(m *testing.M) {
	ctx := context.Background()

	// Read migration file
	migrationPath := filepath.Join("..", "..", "..", "..", "migrations", "001_initial_schema.sql")
	_, err := os.Stat(migrationPath)
	if err != nil {
		fmt.Printf("Failed to access migration file: %v\n", err)
		os.Exit(1)
	}

	// Start Postgres container
	pgContainer, err := postgres.Run(ctx,
		"postgres:16",
		postgres.WithInitScripts(migrationPath),
		postgres.WithDatabase("rpggame"),
		postgres.WithUsername("postgres"),
		postgres.WithPassword("password"),
	)
	if err != nil {
		fmt.Printf("Failed to start postgres container: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			fmt.Printf("Failed to terminate postgres container: %v\n", err)
		}
	}()

	// Get connection string
	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		fmt.Printf("Failed to get connection string: %v\n", err)
		os.Exit(1)
	}

	// Connect to test DB
	testDB, err = sql.Open("postgres", connStr)
	if err != nil {
		fmt.Printf("Failed to open DB: %v\n", err)
		os.Exit(1)
	}
	defer testDB.Close()

	if err := testDB.PingContext(ctx); err != nil {
		fmt.Printf("Failed to ping DB: %v\n", err)
		os.Exit(1)
	}

	code := m.Run()
	os.Exit(code)
}

// buildTestRouter creates a chi router for testing
func buildTestRouter(db *sql.DB) *chi.Mux {
	r := chi.NewRouter()

	svc := NewService(db)
	handler := NewHandler(svc)

	r.Get("/inventory/{userId}", handler.GetInventoryHandler)
	r.Post("/inventory/{userId}/items", handler.AddItemHandler)
	r.Delete("/inventory/{userId}/items/{itemId}", handler.RemoveItemHandler)
	r.Patch("/inventory/{userId}/items/{itemId}", handler.MoveItemHandler)
	r.Post("/inventory/{userId}/items/{itemId}/repair", handler.RepairItemHandler)

	return r
}

// seedTestData inserts basic test data
func seedTestData(t *testing.T, db *sql.DB) (userID, itemID int64) {
	ctx := context.Background()

	// Insert user
	err := db.QueryRowContext(ctx,
		`INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id`,
		"test@example.com", "testuser", "hash",
	).Scan(&userID)
	if err != nil {
		t.Fatalf("Failed to insert user: %v", err)
	}

	// Insert inventory
	_, err = db.ExecContext(ctx,
		`INSERT INTO inventories (user_id, max_slots) VALUES ($1, $2)`,
		userID, 30,
	)
	if err != nil {
		t.Fatalf("Failed to insert inventory: %v", err)
	}

	// Insert item template
	err = db.QueryRowContext(ctx,
		`INSERT INTO item_templates (name, type, rarity, base_durability) VALUES ($1, $2, $3, $4) RETURNING id`,
		"Iron Ore", "material", "common", 100,
	).Scan(&itemID)
	if err != nil {
		t.Fatalf("Failed to insert item template: %v", err)
	}

	return
}

// cleanupTestData truncates all tables
func cleanupTestData(t *testing.T, db *sql.DB) {
	ctx := context.Background()
	tables := []string{
		"crafting_logs", "player_recipes", "recipe_hints", "recipe_ingredients",
		"recipes", "inventory_items", "inventories", "item_templates", "users",
	}
	for _, table := range tables {
		_, err := db.ExecContext(ctx, fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			t.Logf("Warning: Failed to truncate %s: %v", table, err)
		}
	}
}

// TestGetInventory_Integration tests GET /inventory/{userId}
func TestGetInventory_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, itemID := seedTestData(t, testDB)

	// Insert an item into inventory
	ctx := context.Background()
	_, err := testDB.ExecContext(ctx,
		`INSERT INTO inventory_items (inventory_id, item_template_id, quantity)
		 VALUES ((SELECT id FROM inventories WHERE user_id = $1), $2, $3)`,
		userID, itemID, 5,
	)
	if err != nil {
		t.Fatalf("Failed to insert inventory item: %v", err)
	}

	router := buildTestRouter(testDB)
	req := httptest.NewRequest("GET", fmt.Sprintf("/inventory/%d", userID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	items, ok := result["items"].([]interface{})
	if !ok || len(items) == 0 {
		t.Error("expected items in response")
	}
}

// TestAddItem_Integration tests POST /inventory/{userId}/items
func TestAddItem_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, itemID := seedTestData(t, testDB)

	router := buildTestRouter(testDB)

	body := map[string]interface{}{
		"item_template_id": itemID,
		"quantity":         3,
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", fmt.Sprintf("/inventory/%d/items", userID), bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	// Verify item was added
	ctx := context.Background()
	var quantity int
	err := testDB.QueryRowContext(ctx,
		`SELECT quantity FROM inventory_items WHERE item_template_id = $1
		 AND inventory_id = (SELECT id FROM inventories WHERE user_id = $2)`,
		itemID, userID,
	).Scan(&quantity)
	if err != nil || quantity != 3 {
		t.Errorf("expected quantity 3, got %d (err: %v)", quantity, err)
	}
}

// TestAddItemQuantityUpdate_Integration tests quantity increment on duplicate add
func TestAddItemQuantityUpdate_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, itemID := seedTestData(t, testDB)

	router := buildTestRouter(testDB)

	// Add first time
	body := map[string]interface{}{"item_template_id": itemID, "quantity": 2}
	bodyBytes, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", fmt.Sprintf("/inventory/%d/items", userID), bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Errorf("first add: expected 201, got %d", w.Code)
	}

	// Add second time (same item)
	bodyBytes, _ = json.Marshal(body)
	req = httptest.NewRequest("POST", fmt.Sprintf("/inventory/%d/items", userID), bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Errorf("second add: expected 201, got %d", w.Code)
	}

	// Verify quantity is 4 (2+2)
	ctx := context.Background()
	var quantity int
	err := testDB.QueryRowContext(ctx,
		`SELECT quantity FROM inventory_items WHERE item_template_id = $1
		 AND inventory_id = (SELECT id FROM inventories WHERE user_id = $2)`,
		itemID, userID,
	).Scan(&quantity)
	if err != nil || quantity != 4 {
		t.Errorf("expected quantity 4, got %d (err: %v)", quantity, err)
	}
}

// TestRemoveItem_Integration tests DELETE /inventory/{userId}/items/{itemId}
func TestRemoveItem_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, itemID := seedTestData(t, testDB)

	ctx := context.Background()
	// Insert an item
	var invItemID int64
	err := testDB.QueryRowContext(ctx,
		`INSERT INTO inventory_items (inventory_id, item_template_id, quantity)
		 VALUES ((SELECT id FROM inventories WHERE user_id = $1), $2, $3)
		 RETURNING id`,
		userID, itemID, 5,
	).Scan(&invItemID)
	if err != nil {
		t.Fatalf("Failed to insert inventory item: %v", err)
	}

	router := buildTestRouter(testDB)
	req := httptest.NewRequest("DELETE", fmt.Sprintf("/inventory/%d/items/%d", userID, invItemID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// Verify item was removed
	var count int
	err = testDB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM inventory_items WHERE id = $1`, invItemID,
	).Scan(&count)
	if err != nil || count != 0 {
		t.Error("expected item to be deleted")
	}
}

// TestMoveItem_Integration tests PATCH /inventory/{userId}/items/{itemId}
func TestMoveItem_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, itemID := seedTestData(t, testDB)

	ctx := context.Background()
	// Insert an item
	var invItemID int64
	err := testDB.QueryRowContext(ctx,
		`INSERT INTO inventory_items (inventory_id, item_template_id, quantity)
		 VALUES ((SELECT id FROM inventories WHERE user_id = $1), $2, $3)
		 RETURNING id`,
		userID, itemID, 5,
	).Scan(&invItemID)
	if err != nil {
		t.Fatalf("Failed to insert inventory item: %v", err)
	}

	router := buildTestRouter(testDB)

	body := map[string]interface{}{"slot_x": 2, "slot_y": 3}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("PATCH", fmt.Sprintf("/inventory/%d/items/%d", userID, invItemID), bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// Verify slot changed
	var slotX, slotY int
	err = testDB.QueryRowContext(ctx,
		`SELECT slot_x, slot_y FROM inventory_items WHERE id = $1`, invItemID,
	).Scan(&slotX, &slotY)
	if err != nil || slotX != 2 || slotY != 3 {
		t.Errorf("expected slot (2,3), got (%d,%d) (err: %v)", slotX, slotY, err)
	}
}

// TestRepairItemKit_Integration tests POST /inventory/{userId}/items/{itemId}/repair with kit
func TestRepairItemKit_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, itemID := seedTestData(t, testDB)

	ctx := context.Background()
	// Insert an item with reduced durability
	var invItemID int64
	err := testDB.QueryRowContext(ctx,
		`INSERT INTO inventory_items (inventory_id, item_template_id, quantity, current_durability)
		 VALUES ((SELECT id FROM inventories WHERE user_id = $1), $2, $3, $4)
		 RETURNING id`,
		userID, itemID, 1, 50,
	).Scan(&invItemID)
	if err != nil {
		t.Fatalf("Failed to insert inventory item: %v", err)
	}

	router := buildTestRouter(testDB)

	body := map[string]interface{}{"use_kit": true}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", fmt.Sprintf("/inventory/%d/items/%d/repair", userID, invItemID), bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// Verify durability restored to base (100)
	var durability int
	err = testDB.QueryRowContext(ctx,
		`SELECT current_durability FROM inventory_items WHERE id = $1`, invItemID,
	).Scan(&durability)
	if err != nil || durability != 100 {
		t.Errorf("expected durability 100, got %d (err: %v)", durability, err)
	}
}
