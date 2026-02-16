package admin

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

// CreateRecipe inserts new recipe
func (s *Service) CreateRecipe(name, description string, resultItemID int64, successRate, requiredSkillLvl, craftingTimeMs int, discoverable bool) (int64, error) {
	var recipeID int64
	err := s.db.QueryRow(`
		INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, discoverable)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, name, description, resultItemID, successRate, requiredSkillLvl, craftingTimeMs, discoverable).Scan(&recipeID)
	return recipeID, err
}

// CreateItem inserts new item template
func (s *Service) CreateItem(name, itemType, rarity string, baseDurability, repairCost int) (int64, error) {
	var itemID int64
	err := s.db.QueryRow(`
		INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, name, itemType, rarity, baseDurability, repairCost).Scan(&itemID)
	return itemID, err
}

// DeleteRecipe removes recipe
func (s *Service) DeleteRecipe(recipeID int64) error {
	result, err := s.db.Exec(`DELETE FROM recipes WHERE id = $1`, recipeID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return errors.New("recipe not found")
	}

	return nil
}

// DeleteItem removes item template
func (s *Service) DeleteItem(itemID int64) error {
	result, err := s.db.Exec(`DELETE FROM item_templates WHERE id = $1`, itemID)
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
