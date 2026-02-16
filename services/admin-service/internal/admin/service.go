package admin

import (
	"database/sql"
	"errors"

	"github.com/rpgGame/pkg/models"
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

// CreateItem inserts new item template with JSONB fields
func (s *Service) CreateItem(name, itemType, rarity string, baseDurability, repairCost int, repairMaterials, properties models.JSONB) (int64, error) {
	var itemID int64
	err := s.db.QueryRow(`
		INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost, repair_materials, properties)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, name, itemType, rarity, baseDurability, repairCost, repairMaterials, properties).Scan(&itemID)
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

// GetRecipes returns all recipes
func (s *Service) GetRecipes() ([]models.Recipe, error) {
	rows, err := s.db.Query(`
		SELECT id, name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable, created_at, updated_at
		FROM recipes
		ORDER BY name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recipes []models.Recipe
	for rows.Next() {
		var recipe models.Recipe
		if err := rows.Scan(&recipe.ID, &recipe.Name, &recipe.Description, &recipe.ResultItemID, &recipe.SuccessRate, &recipe.RequiredSkillLvl, &recipe.CraftingTimeMs, &recipe.ChainStep, &recipe.Discoverable, &recipe.CreatedAt, &recipe.UpdatedAt); err != nil {
			return nil, err
		}
		recipes = append(recipes, recipe)
	}
	return recipes, rows.Err()
}

// GetRecipe returns a single recipe by ID
func (s *Service) GetRecipe(recipeID int64) (*models.Recipe, error) {
	var recipe models.Recipe
	err := s.db.QueryRow(`
		SELECT id, name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, chain_step, discoverable, created_at, updated_at
		FROM recipes
		WHERE id = $1
	`, recipeID).Scan(&recipe.ID, &recipe.Name, &recipe.Description, &recipe.ResultItemID, &recipe.SuccessRate, &recipe.RequiredSkillLvl, &recipe.CraftingTimeMs, &recipe.ChainStep, &recipe.Discoverable, &recipe.CreatedAt, &recipe.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, errors.New("recipe not found")
	}
	if err != nil {
		return nil, err
	}
	return &recipe, nil
}

// UpdateRecipe updates an existing recipe
func (s *Service) UpdateRecipe(recipeID int64, name, description string, resultItemID int64, successRate, requiredSkillLvl, craftingTimeMs int, discoverable bool) error {
	result, err := s.db.Exec(`
		UPDATE recipes
		SET name = $1, description = $2, result_item_id = $3, success_rate = $4, required_skill_level = $5, crafting_time_ms = $6, discoverable = $7, updated_at = CURRENT_TIMESTAMP
		WHERE id = $8
	`, name, description, resultItemID, successRate, requiredSkillLvl, craftingTimeMs, discoverable, recipeID)

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

// GetItems returns all item templates
func (s *Service) GetItems() ([]models.ItemTemplate, error) {
	rows, err := s.db.Query(`
		SELECT id, name, type, rarity, base_durability, repair_cost, repair_materials, properties, created_at, updated_at
		FROM item_templates
		ORDER BY name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ItemTemplate
	for rows.Next() {
		var item models.ItemTemplate
		if err := rows.Scan(&item.ID, &item.Name, &item.Type, &item.Rarity, &item.BaseDurability, &item.RepairCost, &item.RepairMaterials, &item.Properties, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// GetItem returns a single item template by ID
func (s *Service) GetItem(itemID int64) (*models.ItemTemplate, error) {
	var item models.ItemTemplate
	err := s.db.QueryRow(`
		SELECT id, name, type, rarity, base_durability, repair_cost, repair_materials, properties, created_at, updated_at
		FROM item_templates
		WHERE id = $1
	`, itemID).Scan(&item.ID, &item.Name, &item.Type, &item.Rarity, &item.BaseDurability, &item.RepairCost, &item.RepairMaterials, &item.Properties, &item.CreatedAt, &item.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, errors.New("item not found")
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// UpdateItem updates an existing item template
func (s *Service) UpdateItem(itemID int64, name, itemType, rarity string, baseDurability, repairCost int, repairMaterials, properties models.JSONB) error {
	result, err := s.db.Exec(`
		UPDATE item_templates
		SET name = $1, type = $2, rarity = $3, base_durability = $4, repair_cost = $5, repair_materials = $6, properties = $7, updated_at = CURRENT_TIMESTAMP
		WHERE id = $8
	`, name, itemType, rarity, baseDurability, repairCost, repairMaterials, properties, itemID)

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
