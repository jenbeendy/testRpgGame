package admin

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/rpgGame/pkg/models"
)

// Import request/response structures
type ItemImportEntry struct {
	Name            string         `json:"name"`
	Type            string         `json:"type"`
	Rarity          string         `json:"rarity"`
	BaseDurability  int            `json:"base_durability"`
	RepairCost      int            `json:"repair_cost"`
	RepairMaterials map[string]any `json:"repair_materials"`
	Properties      map[string]any `json:"properties"`
}

type RecipeImportEntry struct {
	Name               string                  `json:"name"`
	Description        string                  `json:"description"`
	ResultItemName     string                  `json:"result_item_name"`
	SuccessRate        int                     `json:"success_rate"`
	RequiredSkillLevel int                     `json:"required_skill_level"`
	CraftingTimeMs     int                     `json:"crafting_time_ms"`
	Discoverable       bool                    `json:"discoverable"`
	Ingredients        []IngredientImportEntry `json:"ingredients"`
}

type IngredientImportEntry struct {
	ItemName string `json:"item_name"`
	Quantity int    `json:"quantity"`
	Position int    `json:"position"`
	Optional bool   `json:"optional"`
}

type BatchImportRequest struct {
	Items   []ItemImportEntry   `json:"items"`
	Recipes []RecipeImportEntry `json:"recipes"`
}

// Preview types
type ItemPreview struct {
	Name   string   `json:"name"`
	Action string   `json:"action"` // "create" or "update"
	Errors []string `json:"errors"`
}

type RecipePreview struct {
	Name   string   `json:"name"`
	Action string   `json:"action"` // "create" or "update"
	Errors []string `json:"errors"`
}

type PreviewSummary struct {
	ItemsCreate   int `json:"items_create"`
	ItemsUpdate   int `json:"items_update"`
	ItemsError    int `json:"items_error"`
	RecipesCreate int `json:"recipes_create"`
	RecipesUpdate int `json:"recipes_update"`
	RecipesError  int `json:"recipes_error"`
}

type BatchImportPreview struct {
	Items   []ItemPreview   `json:"items"`
	Recipes []RecipePreview `json:"recipes"`
	Summary PreviewSummary  `json:"summary"`
}

// Result types
type ItemResult struct {
	Name    string `json:"name"`
	Success bool   `json:"success"`
	Action  string `json:"action"` // "created", "updated", "skipped"
	Error   string `json:"error"`
}

type RecipeResult struct {
	Name    string `json:"name"`
	Success bool   `json:"success"`
	Action  string `json:"action"` // "created", "updated", "skipped"
	Error   string `json:"error"`
}

type ResultSummary struct {
	ItemsCreated   int `json:"items_created"`
	ItemsUpdated   int `json:"items_updated"`
	ItemsSkipped   int `json:"items_skipped"`
	RecipesCreated int `json:"recipes_created"`
	RecipesUpdated int `json:"recipes_updated"`
	RecipesSkipped int `json:"recipes_skipped"`
}

type BatchImportResult struct {
	Items   []ItemResult   `json:"items"`
	Recipes []RecipeResult `json:"recipes"`
	Summary ResultSummary  `json:"summary"`
}

// Validation
var validTypes = map[string]bool{
	"weapon":    true,
	"armor":     true,
	"material":  true,
	"consumable": true,
}

var validRarities = map[string]bool{
	"common":    true,
	"uncommon":  true,
	"rare":      true,
	"epic":      true,
	"legendary": true,
}

func validateItem(item ItemImportEntry) []string {
	var errors []string

	if strings.TrimSpace(item.Name) == "" {
		errors = append(errors, "name required")
	}

	if !validTypes[item.Type] {
		errors = append(errors, fmt.Sprintf("invalid type: %s", item.Type))
	}

	if !validRarities[item.Rarity] {
		errors = append(errors, fmt.Sprintf("invalid rarity: %s", item.Rarity))
	}

	if item.BaseDurability < 0 {
		errors = append(errors, "base_durability >= 0")
	}

	if item.RepairCost < 0 {
		errors = append(errors, "repair_cost >= 0")
	}

	return errors
}

func validateRecipe(recipe RecipeImportEntry) []string {
	var errors []string

	if strings.TrimSpace(recipe.Name) == "" {
		errors = append(errors, "name required")
	}

	if strings.TrimSpace(recipe.ResultItemName) == "" {
		errors = append(errors, "result_item_name required")
	}

	if recipe.SuccessRate < 0 || recipe.SuccessRate > 100 {
		errors = append(errors, "success_rate must be 0-100")
	}

	if recipe.RequiredSkillLevel < 0 {
		errors = append(errors, "required_skill_level >= 0")
	}

	if recipe.CraftingTimeMs < 0 {
		errors = append(errors, "crafting_time_ms >= 0")
	}

	// Validate ingredients
	positions := make(map[int]bool)
	for _, ing := range recipe.Ingredients {
		if strings.TrimSpace(ing.ItemName) == "" {
			errors = append(errors, fmt.Sprintf("ingredient at position %d: item_name required", ing.Position))
		}
		if ing.Quantity < 1 {
			errors = append(errors, fmt.Sprintf("ingredient %s: quantity >= 1", ing.ItemName))
		}
		if positions[ing.Position] {
			errors = append(errors, fmt.Sprintf("duplicate ingredient position: %d", ing.Position))
		}
		positions[ing.Position] = true
	}

	return errors
}

// PreviewBatchImport validates import without writing to DB
func (s *Service) PreviewBatchImport(req BatchImportRequest) (*BatchImportPreview, error) {
	preview := &BatchImportPreview{
		Items:   make([]ItemPreview, 0),
		Recipes: make([]RecipePreview, 0),
		Summary: PreviewSummary{},
	}

	// Preview items
	existingItems := make(map[string]bool)
	for _, item := range req.Items {
		itemPreview := ItemPreview{
			Name: item.Name,
		}

		// Validate
		errors := validateItem(item)
		if len(errors) > 0 {
			itemPreview.Errors = errors
			itemPreview.Action = "error"
			preview.Summary.ItemsError++
			preview.Items = append(preview.Items, itemPreview)
			continue
		}

		// Check if exists
		exists, err := s.itemExists(item.Name)
		if err == nil && exists {
			itemPreview.Action = "update"
			preview.Summary.ItemsUpdate++
			existingItems[item.Name] = true
		} else {
			itemPreview.Action = "create"
			preview.Summary.ItemsCreate++
			existingItems[item.Name] = false
		}

		preview.Items = append(preview.Items, itemPreview)
	}

	// Preview recipes
	for _, recipe := range req.Recipes {
		recipePreview := RecipePreview{
			Name: recipe.Name,
		}

		// Validate
		errors := validateRecipe(recipe)
		if len(errors) > 0 {
			recipePreview.Errors = errors
			recipePreview.Action = "error"
			preview.Summary.RecipesError++
			preview.Recipes = append(preview.Recipes, recipePreview)
			continue
		}

		// Check result item exists
		if !existingItems[recipe.ResultItemName] {
			exists, err := s.itemExists(recipe.ResultItemName)
			if err != nil || !exists {
				recipePreview.Errors = append(recipePreview.Errors, fmt.Sprintf("result item not found: %s", recipe.ResultItemName))
				recipePreview.Action = "error"
				preview.Summary.RecipesError++
				preview.Recipes = append(preview.Recipes, recipePreview)
				continue
			}
		}

		// Check all ingredients exist
		for _, ing := range recipe.Ingredients {
			if !existingItems[ing.ItemName] {
				exists, err := s.itemExists(ing.ItemName)
				if err != nil || !exists {
					recipePreview.Errors = append(recipePreview.Errors, fmt.Sprintf("ingredient item not found: %s", ing.ItemName))
				}
			}
		}

		if len(recipePreview.Errors) > 0 {
			recipePreview.Action = "error"
			preview.Summary.RecipesError++
			preview.Recipes = append(preview.Recipes, recipePreview)
			continue
		}

		// Check if recipe exists
		exists, err := s.recipeExists(recipe.Name)
		if err == nil && exists {
			recipePreview.Action = "update"
			preview.Summary.RecipesUpdate++
		} else {
			recipePreview.Action = "create"
			preview.Summary.RecipesCreate++
		}

		preview.Recipes = append(preview.Recipes, recipePreview)
	}

	return preview, nil
}

// ExecuteBatchImport processes import with DB writes (transaction)
func (s *Service) ExecuteBatchImport(req BatchImportRequest) (*BatchImportResult, error) {
	result := &BatchImportResult{
		Items:   make([]ItemResult, 0),
		Recipes: make([]RecipeResult, 0),
	}

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return result, fmt.Errorf("transaction begin failed: %w", err)
	}

	// Build item name -> ID map
	itemNameToID := make(map[string]int64)

	// Process items
	for _, item := range req.Items {
		itemResult := ItemResult{
			Name:    item.Name,
			Success: true,
		}

		// Validate
		errors := validateItem(item)
		if len(errors) > 0 {
			itemResult.Success = false
			itemResult.Action = "skipped"
			itemResult.Error = strings.Join(errors, "; ")
			result.Items = append(result.Items, itemResult)
			result.Summary.ItemsSkipped++
			continue
		}

		// Check if exists
		exists, id := s.itemExistsTx(tx, item.Name)

		// Marshal JSONB fields
		repairMatBytes, _ := json.Marshal(item.RepairMaterials)
		propBytes, _ := json.Marshal(item.Properties)

		if exists {
			// Update
			_, err := tx.Exec(`
				UPDATE item_templates
				SET type = $1, rarity = $2, base_durability = $3, repair_cost = $4, repair_materials = $5, properties = $6, updated_at = CURRENT_TIMESTAMP
				WHERE id = $7
			`, item.Type, item.Rarity, item.BaseDurability, item.RepairCost, models.JSONB(repairMatBytes), models.JSONB(propBytes), id)

			if err != nil {
				itemResult.Success = false
				itemResult.Action = "skipped"
				itemResult.Error = err.Error()
				result.Items = append(result.Items, itemResult)
				result.Summary.ItemsSkipped++
				continue
			}

			itemResult.Action = "updated"
			result.Summary.ItemsUpdated++
			itemNameToID[item.Name] = id
		} else {
			// Create
			var newID int64
			err := tx.QueryRow(`
				INSERT INTO item_templates (name, type, rarity, base_durability, repair_cost, repair_materials, properties)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id
			`, item.Name, item.Type, item.Rarity, item.BaseDurability, item.RepairCost, models.JSONB(repairMatBytes), models.JSONB(propBytes)).Scan(&newID)

			if err != nil {
				itemResult.Success = false
				itemResult.Action = "skipped"
				itemResult.Error = err.Error()
				result.Items = append(result.Items, itemResult)
				result.Summary.ItemsSkipped++
				continue
			}

			itemResult.Action = "created"
			result.Summary.ItemsCreated++
			itemNameToID[item.Name] = newID
		}

		result.Items = append(result.Items, itemResult)
	}

	// Process recipes
	for _, recipe := range req.Recipes {
		recipeResult := RecipeResult{
			Name:    recipe.Name,
			Success: true,
		}

		// Validate
		errors := validateRecipe(recipe)
		if len(errors) > 0 {
			recipeResult.Success = false
			recipeResult.Action = "skipped"
			recipeResult.Error = strings.Join(errors, "; ")
			result.Recipes = append(result.Recipes, recipeResult)
			result.Summary.RecipesSkipped++
			continue
		}

		// Resolve result item ID
		resultItemID, ok := itemNameToID[recipe.ResultItemName]
		if !ok {
			// Try to find in DB
			var id int64
			err := tx.QueryRow("SELECT id FROM item_templates WHERE name = $1", recipe.ResultItemName).Scan(&id)
			if err != nil {
				recipeResult.Success = false
				recipeResult.Action = "skipped"
				recipeResult.Error = fmt.Sprintf("result item not found: %s", recipe.ResultItemName)
				result.Recipes = append(result.Recipes, recipeResult)
				result.Summary.RecipesSkipped++
				continue
			}
			resultItemID = id
		}

		// Check if recipe exists
		exists, id := s.recipeExistsTx(tx, recipe.Name)

		if exists {
			// Update recipe
			_, err := tx.Exec(`
				UPDATE recipes
				SET description = $1, result_item_id = $2, success_rate = $3, required_skill_level = $4, crafting_time_ms = $5, discoverable = $6, updated_at = CURRENT_TIMESTAMP
				WHERE id = $7
			`, recipe.Description, resultItemID, recipe.SuccessRate, recipe.RequiredSkillLevel, recipe.CraftingTimeMs, recipe.Discoverable, id)

			if err != nil {
				recipeResult.Success = false
				recipeResult.Action = "skipped"
				recipeResult.Error = err.Error()
				result.Recipes = append(result.Recipes, recipeResult)
				result.Summary.RecipesSkipped++
				continue
			}

			recipeResult.Action = "updated"
			result.Summary.RecipesUpdated++

			// Delete old ingredients
			_, _ = tx.Exec("DELETE FROM recipe_ingredients WHERE recipe_id = $1", id)
		} else {
			// Create recipe
			var newID int64
			err := tx.QueryRow(`
				INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, discoverable)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id
			`, recipe.Name, recipe.Description, resultItemID, recipe.SuccessRate, recipe.RequiredSkillLevel, recipe.CraftingTimeMs, recipe.Discoverable).Scan(&newID)

			if err != nil {
				recipeResult.Success = false
				recipeResult.Action = "skipped"
				recipeResult.Error = err.Error()
				result.Recipes = append(result.Recipes, recipeResult)
				result.Summary.RecipesSkipped++
				continue
			}

			recipeResult.Action = "created"
			result.Summary.RecipesCreated++
			id = newID
		}

		// Insert ingredients
		for _, ing := range recipe.Ingredients {
			ingItemID, ok := itemNameToID[ing.ItemName]
			if !ok {
				var iid int64
				_ = tx.QueryRow("SELECT id FROM item_templates WHERE name = $1", ing.ItemName).Scan(&iid)
				ingItemID = iid
			}

			_, err := tx.Exec(`
				INSERT INTO recipe_ingredients (recipe_id, item_id, quantity, position, optional)
				VALUES ($1, $2, $3, $4, $5)
			`, id, ingItemID, ing.Quantity, ing.Position, ing.Optional)

			if err != nil {
				recipeResult.Success = false
				recipeResult.Error = fmt.Sprintf("ingredient insert failed: %v", err)
				break
			}
		}

		result.Recipes = append(result.Recipes, recipeResult)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return result, fmt.Errorf("transaction commit failed: %w", err)
	}

	return result, nil
}

// Helper functions
func (s *Service) itemExists(name string) (bool, error) {
	var id int64
	err := s.db.QueryRow("SELECT id FROM item_templates WHERE name = $1", name).Scan(&id)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func (s *Service) itemExistsTx(tx *sql.Tx, name string) (bool, int64) {
	var id int64
	err := tx.QueryRow("SELECT id FROM item_templates WHERE name = $1", name).Scan(&id)
	if err == sql.ErrNoRows {
		return false, 0
	}
	return true, id
}

func (s *Service) recipeExists(name string) (bool, error) {
	var id int64
	err := s.db.QueryRow("SELECT id FROM recipes WHERE name = $1", name).Scan(&id)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func (s *Service) recipeExistsTx(tx *sql.Tx, name string) (bool, int64) {
	var id int64
	err := tx.QueryRow("SELECT id FROM recipes WHERE name = $1", name).Scan(&id)
	if err == sql.ErrNoRows {
		return false, 0
	}
	return true, id
}
