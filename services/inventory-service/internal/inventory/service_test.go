package inventory

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

// TestGetInventory tests retrieving user inventory
func TestGetInventory(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID := int64(1)
	rows := sqlmock.NewRows([]string{"id", "item_template_id", "quantity", "slot_x", "slot_y", "current_durability"}).
		AddRow(int64(1), int64(10), 5, 0, 0, 100).
		AddRow(int64(2), int64(11), 3, 1, 0, 75)

	mock.ExpectQuery(`SELECT.*FROM inventory_items`).WithArgs(userID).WillReturnRows(rows)

	svc := NewService(db)
	items, err := svc.GetInventory(userID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 2 {
		t.Errorf("expected 2 items, got %d", len(items))
	}
	if items[0].ID != 1 || items[0].ItemTemplateID != 10 {
		t.Errorf("first item mismatch: %+v", items[0])
	}
	if items[1].CurrentDurable != 75 {
		t.Errorf("expected durability 75, got %d", items[1].CurrentDurable)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestAddItemUpdatePath tests adding quantity to existing item
func TestAddItemUpdatePath(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, itemTemplateID := int64(1), int64(10)

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT id FROM inventories WHERE user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	// Check if item exists - returns existing ID
	existRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(5))
	mock.ExpectQuery(`SELECT id FROM inventory_items WHERE inventory_id = \$1 AND item_template_id = \$2`).
		WithArgs(int64(1), itemTemplateID).
		WillReturnRows(existRows)

	// Update quantity
	mock.ExpectExec(`UPDATE inventory_items SET quantity = quantity \+ \$1`).
		WithArgs(3, int64(5)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	svc := NewService(db)
	err = svc.AddItem(userID, itemTemplateID, 3)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestAddItemInsertPath tests adding new item to inventory
func TestAddItemInsertPath(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, itemTemplateID := int64(1), int64(10)

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT id FROM inventories WHERE user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	// Check if item exists - returns no rows (not found)
	mock.ExpectQuery(`SELECT id FROM inventory_items WHERE inventory_id = \$1 AND item_template_id = \$2`).
		WithArgs(int64(1), itemTemplateID).
		WillReturnError(sql.ErrNoRows)

	// Insert new item with durability=100 (hardcoded in SQL)
	mock.ExpectExec(`INSERT INTO inventory_items`).
		WithArgs(int64(1), itemTemplateID, 5).
		WillReturnResult(sqlmock.NewResult(1, 1))

	svc := NewService(db)
	err = svc.AddItem(userID, itemTemplateID, 5)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestRemoveItemSuccess tests successful item removal
func TestRemoveItemSuccess(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, itemID := int64(1), int64(5)

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT i.id FROM inventories i WHERE i.user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	// Delete item - returns 1 row affected
	mock.ExpectExec(`DELETE FROM inventory_items WHERE id = \$1 AND inventory_id = \$2`).
		WithArgs(itemID, int64(1)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	svc := NewService(db)
	err = svc.RemoveItem(userID, itemID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestRemoveItemNotFound tests removal of non-existent item
func TestRemoveItemNotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, itemID := int64(1), int64(999)

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT i.id FROM inventories i WHERE i.user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	// Delete item - returns 0 rows affected
	mock.ExpectExec(`DELETE FROM inventory_items WHERE id = \$1 AND inventory_id = \$2`).
		WithArgs(itemID, int64(1)).
		WillReturnResult(sqlmock.NewResult(0, 0))

	svc := NewService(db)
	err = svc.RemoveItem(userID, itemID)

	if err == nil {
		t.Error("expected error for missing item")
	}
	if err.Error() != "item not found" {
		t.Errorf("expected 'item not found', got %v", err)
	}
}

// TestMoveItemSuccess tests successful item move
func TestMoveItemSuccess(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, itemID := int64(1), int64(5)

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT i.id FROM inventories i WHERE i.user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	// Update item slot
	mock.ExpectExec(`UPDATE inventory_items SET slot_x = \$1, slot_y = \$2`).
		WithArgs(2, 3, itemID, int64(1)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	svc := NewService(db)
	err = svc.MoveItem(userID, itemID, 2, 3)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestConsumeItemsSuccess tests successful consumption of items
func TestConsumeItemsSuccess(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID := int64(1)
	items := map[int64]int{
		int64(10): 2,
	}

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT id FROM inventories WHERE user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	mock.ExpectBegin()

	// Consume item - UPDATE has $1 twice (qty and in quantity >= $1), so params are: qty, inventoryID, itemTemplateID
	mock.ExpectExec(`UPDATE inventory_items SET quantity = quantity - \$1`).
		WithArgs(2, int64(1), int64(10)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectCommit()

	svc := NewService(db)
	err = svc.ConsumeItems(userID, items)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestConsumeItemsInsufficient tests consumption failure due to insufficient items
func TestConsumeItemsInsufficient(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID := int64(1)
	items := map[int64]int{
		int64(10): 100, // insufficient
	}

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT id FROM inventories WHERE user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	mock.ExpectBegin()

	// Consume item - fails (0 rows affected due to insufficient quantity)
	mock.ExpectExec(`UPDATE inventory_items SET quantity = quantity - \$1`).
		WithArgs(100, int64(1), int64(10)).
		WillReturnResult(sqlmock.NewResult(0, 0))

	mock.ExpectRollback()

	svc := NewService(db)
	err = svc.ConsumeItems(userID, items)

	if err == nil {
		t.Error("expected error for insufficient items")
	}
	if err.Error() != "insufficient items" {
		t.Errorf("expected 'insufficient items', got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestRepairItemWithKit tests repair using kit (full restore)
func TestRepairItemWithKit(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, itemID := int64(1), int64(5)

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT id FROM inventories WHERE user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	mock.ExpectBegin()

	// Get item's base durability
	baseRows := sqlmock.NewRows([]string{"base_durability", "current_durability"}).
		AddRow(int64(100), 50)
	mock.ExpectQuery(`SELECT.*FROM inventory_items ii.*JOIN item_templates`).
		WithArgs(itemID, int64(1)).
		WillReturnRows(baseRows)

	// Restore to full durability
	mock.ExpectExec(`UPDATE inventory_items SET current_durability = \$1`).
		WithArgs(int64(100), itemID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectCommit()

	svc := NewService(db)
	err = svc.RepairItem(userID, itemID, true)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestRepairItemWithMaterials tests repair using materials (50% restore)
// NOTE: Documents bug - repair_materials JSONB never parsed/consumed
func TestRepairItemWithMaterials(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, itemID := int64(1), int64(5)

	// Get inventory ID
	invRows := sqlmock.NewRows([]string{"id"}).AddRow(int64(1))
	mock.ExpectQuery(`SELECT id FROM inventories WHERE user_id = \$1`).WithArgs(userID).WillReturnRows(invRows)

	// Get repair materials (JSONB - currently not parsed)
	matRows := sqlmock.NewRows([]string{"repair_materials"}).
		AddRow([]byte(`[{"item_id": 50, "quantity": 5}]`))
	mock.ExpectQuery(`SELECT it.repair_materials`).
		WithArgs(itemID, int64(1)).
		WillReturnRows(matRows)

	mock.ExpectBegin()

	// Get base durability
	baseRows := sqlmock.NewRows([]string{"base_durability"}).AddRow(100)
	mock.ExpectQuery(`SELECT it.base_durability FROM inventory_items ii`).
		WithArgs(itemID).
		WillReturnRows(baseRows)

	// Restore 50% durability
	restoreAmount := 100 / 2
	mock.ExpectExec(`UPDATE inventory_items SET current_durability = LEAST`).
		WithArgs(100, restoreAmount, itemID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectCommit()

	svc := NewService(db)
	err = svc.RepairItem(userID, itemID, false)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// NOTE: Bug - repair_materials JSONB is fetched but never parsed or consumed
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestDecayDurability tests durability decay background job for single user
func TestDecayDurability(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID := int64(1)

	// Update query with GREATEST and time check
	mock.ExpectExec(`UPDATE inventory_items`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 3))

	svc := NewService(db)
	err = svc.DecayDurability(userID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestDecayAllDurability tests global durability decay across all players
func TestDecayAllDurability(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	// Update query for all items without user filter
	mock.ExpectExec(`UPDATE inventory_items`).
		WillReturnResult(sqlmock.NewResult(0, 7))

	svc := NewService(db)
	rowsAffected, err := svc.DecayAllDurability()

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rowsAffected != 7 {
		t.Errorf("expected 7 rows affected, got %d", rowsAffected)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}
