//go:build integration

package crafting

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

	// Read migration file (relative from test location)
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

// userIDMiddleware injects user_id from X-Test-User-ID header into context
func userIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userIDStr := r.Header.Get("X-Test-User-ID")
		if userIDStr != "" {
			var userID int64
			fmt.Sscanf(userIDStr, "%d", &userID)
			ctx := context.WithValue(r.Context(), "user_id", userID)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// buildTestRouter creates a chi router for testing
func buildTestRouter(db *sql.DB) *chi.Mux {
	r := chi.NewRouter()
	r.Use(userIDMiddleware)

	svc := NewService(db)
	handler := NewHandler(svc)

	r.Get("/recipes", handler.GetRecipesHandler)
	r.Get("/recipes/{id}", handler.GetRecipeHandler)
	r.Get("/recipes/{id}/hint", handler.GetRecipeHintHandler)
	r.Post("/craft", handler.CraftHandler)
	r.Get("/player-recipes/{userId}", handler.GetPlayerRecipesHandler)
	r.Post("/discover-recipe", handler.DiscoverRecipeHandler)
	r.Get("/skills/{userId}", handler.GetSkillsHandler)

	return r
}

// seedTestData inserts basic test data
func seedTestData(t *testing.T, db *sql.DB) (userID, itemID, recipeID int64) {
	ctx := context.Background()

	// Insert user
	err := db.QueryRowContext(ctx,
		`INSERT INTO users (email, username, password_hash, crafting_skill_level, crafting_xp, is_admin)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		"test@example.com", "testuser", "hash", 5, 0, false,
	).Scan(&userID)
	if err != nil {
		t.Fatalf("Failed to insert user: %v", err)
	}

	// Insert inventory (register user auto-creates inventory, but we do it manually here)
	_, err = db.ExecContext(ctx,
		`INSERT INTO inventories (user_id, max_slots) VALUES ($1, $2)`,
		userID, 30,
	)
	if err != nil {
		t.Fatalf("Failed to insert inventory: %v", err)
	}

	// Insert item template
	err = db.QueryRowContext(ctx,
		`INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost, properties)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		"Iron Ore", "material", "common", 100, 0, "{}",
	).Scan(&itemID)
	if err != nil {
		t.Fatalf("Failed to insert item template: %v", err)
	}

	// Insert recipe
	err = db.QueryRowContext(ctx,
		`INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, discoverable)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		"Test Recipe", "A test recipe", itemID, 100, 0, 1000, true,
	).Scan(&recipeID)
	if err != nil {
		t.Fatalf("Failed to insert recipe: %v", err)
	}

	// Insert recipe ingredient
	_, err = db.ExecContext(ctx,
		`INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position, optional)
		 VALUES ($1, $2, $3, $4, $5)`,
		recipeID, itemID, 2, 0, false,
	)
	if err != nil {
		t.Fatalf("Failed to insert recipe ingredient: %v", err)
	}

	// Insert inventory item
	_, err = db.ExecContext(ctx,
		`INSERT INTO inventory_items (inventory_id, item_template_id, quantity, current_durability)
		 VALUES ((SELECT id FROM inventories WHERE user_id = $1), $2, $3, $4)`,
		userID, itemID, 10, 100,
	)
	if err != nil {
		t.Fatalf("Failed to insert inventory item: %v", err)
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

// TestGetAllRecipes_Integration tests GET /recipes
func TestGetAllRecipes_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	_, _, _ = seedTestData(t, testDB)

	router := buildTestRouter(testDB)
	req := httptest.NewRequest("GET", "/recipes", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	recipes, ok := result["recipes"].([]interface{})
	if !ok || len(recipes) == 0 {
		t.Error("expected recipes in response")
	}
}

// TestGetRecipe_Integration tests GET /recipes/{id}
func TestGetRecipe_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	_, _, recipeID := seedTestData(t, testDB)

	router := buildTestRouter(testDB)
	req := httptest.NewRequest("GET", fmt.Sprintf("/recipes/%d", recipeID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if result["name"] != "Test Recipe" {
		t.Errorf("expected 'Test Recipe', got %v", result["name"])
	}
}

// TestGetRecipeNotFound_Integration tests 404 on missing recipe
func TestGetRecipeNotFound_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)

	router := buildTestRouter(testDB)
	req := httptest.NewRequest("GET", "/recipes/9999", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

// TestCraftSuccess_Integration tests POST /craft with guaranteed success
func TestCraftSuccess_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, itemID, recipeID := seedTestData(t, testDB)

	router := buildTestRouter(testDB)

	body := map[string]interface{}{
		"recipe_id":   recipeID,
		"ingredients": map[string]int{fmt.Sprintf("%d", itemID): 2},
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/craft", bytes.NewReader(bodyBytes))
	req.Header.Set("X-Test-User-ID", fmt.Sprintf("%d", userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if success, ok := result["success"].(bool); !ok || !success {
		t.Error("expected success=true for 100% recipe")
	}
}

// TestDiscoverRecipeNew_Integration tests POST /discover-recipe
func TestDiscoverRecipeNew_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, _, recipeID := seedTestData(t, testDB)

	router := buildTestRouter(testDB)

	body := map[string]interface{}{"recipe_id": recipeID}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/discover-recipe", bytes.NewReader(bodyBytes))
	req.Header.Set("X-Test-User-ID", fmt.Sprintf("%d", userID))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if discovered, ok := result["discovered"].(bool); !ok || !discovered {
		t.Error("expected discovered=true")
	}
}

// TestGetSkills_Integration tests GET /skills/{userId}
func TestGetSkills_Integration(t *testing.T) {
	defer cleanupTestData(t, testDB)
	userID, _, _ := seedTestData(t, testDB)

	router := buildTestRouter(testDB)
	req := httptest.NewRequest("GET", fmt.Sprintf("/skills/%d", userID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if level, ok := result["crafting_level"].(float64); !ok || level != 5 {
		t.Errorf("expected crafting_level=5, got %v", result["crafting_level"])
	}
}
