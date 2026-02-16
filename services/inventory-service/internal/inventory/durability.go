package inventory

// DecayDurability applies time-based decay to items (hourly background job)
func (s *Service) DecayDurability(userID int64) error {
	query := `
		UPDATE inventory_items
		SET current_durability = GREATEST(0, current_durability - 1),
		    last_decay_check = CURRENT_TIMESTAMP
		WHERE inventory_id = (SELECT id FROM inventories WHERE user_id = $1)
		AND (CURRENT_TIMESTAMP - last_decay_check) > INTERVAL '1 hour'
	`
	_, err := s.db.Exec(query, userID)
	return err
}

// RepairItem repairs an item using materials
func (s *Service) RepairItem(userID, itemID int64, useKit bool) error {
	if useKit {
		return s.repairWithKit(userID, itemID)
	}
	return s.repairWithMaterials(userID, itemID)
}

func (s *Service) repairWithKit(userID, itemID int64) error {
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

	// Get item's base durability
	var baseDurable int64
	var currentDurable int
	err = tx.QueryRow(
		`SELECT it.base_durability, ii.current_durability
		 FROM inventory_items ii
		 JOIN item_templates it ON ii.item_template_id = it.id
		 WHERE ii.id = $1 AND ii.inventory_id = $2`,
		itemID, inventoryID,
	).Scan(&baseDurable, &currentDurable)
	if err != nil {
		return err
	}

	// Restore to full durability
	_, err = tx.Exec(
		`UPDATE inventory_items SET current_durability = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
		baseDurable, itemID,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *Service) repairWithMaterials(userID, itemID int64) error {
	var inventoryID int64
	err := s.db.QueryRow(`SELECT id FROM inventories WHERE user_id = $1`, userID).Scan(&inventoryID)
	if err != nil {
		return err
	}

	// Get repair materials needed
	var repairMaterials []byte
	err = s.db.QueryRow(
		`SELECT it.repair_materials
		 FROM inventory_items ii
		 JOIN item_templates it ON ii.item_template_id = it.id
		 WHERE ii.id = $1 AND ii.inventory_id = $2`,
		itemID, inventoryID,
	).Scan(&repairMaterials)
	if err != nil {
		return err
	}

	// TODO: Parse JSONB repair_materials and consume them
	// For now, simplified: restore 50% durability
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var baseDurable int
	err = tx.QueryRow(
		`SELECT it.base_durability FROM inventory_items ii
		 JOIN item_templates it ON ii.item_template_id = it.id
		 WHERE ii.id = $1`,
		itemID,
	).Scan(&baseDurable)
	if err != nil {
		return err
	}

	// Restore 50% durability
	restoreAmount := baseDurable / 2
	_, err = tx.Exec(
		`UPDATE inventory_items SET current_durability = LEAST($1, GREATEST(0, current_durability + $2)),
		 updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
		baseDurable, restoreAmount, itemID,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}
