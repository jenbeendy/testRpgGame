package inventory

import (
	"database/sql"
	"errors"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// ItemDTO for API responses
type ItemDTO struct {
	ID               int64  `json:"id"`
	ItemTemplateID   int64  `json:"item_template_id"`
	Quantity         int    `json:"quantity"`
	SlotX            *int   `json:"slot_x"`
	SlotY            *int   `json:"slot_y"`
	CurrentDurable   int    `json:"current_durability"`
}

// GetInventory retrieves user's inventory
func (s *Service) GetInventory(userID int64) ([]ItemDTO, error) {
	query := `
		SELECT ii.id, ii.item_template_id, ii.quantity, ii.slot_x, ii.slot_y, ii.current_durability
		FROM inventory_items ii
		JOIN inventories i ON ii.inventory_id = i.id
		WHERE i.user_id = $1
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ItemDTO, 0) // Initialize with empty slice, not nil
	for rows.Next() {
		var item ItemDTO
		if err := rows.Scan(&item.ID, &item.ItemTemplateID, &item.Quantity, &item.SlotX, &item.SlotY, &item.CurrentDurable); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

// AddItem adds item to inventory
func (s *Service) AddItem(userID, itemTemplateID int64, quantity int) error {
	var inventoryID int64
	err := s.db.QueryRow(`SELECT id FROM inventories WHERE user_id = $1`, userID).Scan(&inventoryID)
	if err == sql.ErrNoRows {
		return errors.New("inventory not found")
	}
	if err != nil {
		return err
	}

	// Check if item exists in inventory
	var existingID int64
	err = s.db.QueryRow(
		`SELECT id FROM inventory_items WHERE inventory_id = $1 AND item_template_id = $2 LIMIT 1`,
		inventoryID, itemTemplateID,
	).Scan(&existingID)

	if err == nil {
		// Update quantity
		_, err := s.db.Exec(
			`UPDATE inventory_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
			quantity, existingID,
		)
		return err
	} else if err == sql.ErrNoRows {
		// Insert new item
		_, err := s.db.Exec(
			`INSERT INTO inventory_items (inventory_id, item_template_id, quantity, current_durability)
			 VALUES ($1, $2, $3, 100)`,
			inventoryID, itemTemplateID, quantity,
		)
		return err
	}
	return err
}

// RemoveItem removes item from inventory
func (s *Service) RemoveItem(userID, itemID int64) error {
	var inventoryID int64
	err := s.db.QueryRow(
		`SELECT i.id FROM inventories i WHERE i.user_id = $1`,
		userID,
	).Scan(&inventoryID)
	if err != nil {
		return err
	}

	result, err := s.db.Exec(
		`DELETE FROM inventory_items WHERE id = $1 AND inventory_id = $2`,
		itemID, inventoryID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return errors.New("item not found")
	}

	return nil
}

// MoveItem moves item to new slot
func (s *Service) MoveItem(userID, itemID int64, slotX, slotY int) error {
	var inventoryID int64
	err := s.db.QueryRow(
		`SELECT i.id FROM inventories i WHERE i.user_id = $1`,
		userID,
	).Scan(&inventoryID)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(
		`UPDATE inventory_items SET slot_x = $1, slot_y = $2, updated_at = CURRENT_TIMESTAMP
		 WHERE id = $3 AND inventory_id = $4`,
		slotX, slotY, itemID, inventoryID,
	)
	return err
}

// ConsumeItems removes items from inventory (for crafting)
func (s *Service) ConsumeItems(userID int64, items map[int64]int) error {
	var inventoryID int64
	err := s.db.QueryRow(`SELECT id FROM inventories WHERE user_id = $1`, userID).Scan(&inventoryID)
	if err != nil {
		return err
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for itemTemplateID, qty := range items {
		result, err := tx.Exec(
			`UPDATE inventory_items SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
			 WHERE inventory_id = $2 AND item_template_id = $3 AND quantity >= $1`,
			qty, inventoryID, itemTemplateID,
		)
		if err != nil {
			return err
		}

		rowsAff, err := result.RowsAffected()
		if err != nil {
			return err
		}

		if rowsAff == 0 {
			return errors.New("insufficient items")
		}
	}

	return tx.Commit()
}
