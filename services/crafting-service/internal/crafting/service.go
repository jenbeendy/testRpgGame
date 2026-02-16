package crafting

import (
	"database/sql"
	"errors"
	"fmt"
	"math/rand"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// Recipe info returned to client
type RecipeInfo struct {
	ID               int64  `json:"id"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	SuccessRate      int    `json:"success_rate"`
	RequiredSkillLvl int    `json:"required_skill_level"`
	CraftingTimeMs   int    `json:"crafting_time_ms"`
	Ingredients      []IngredientInfo `json:"ingredients"`
}

type IngredientInfo struct {
	ItemID   int64 `json:"item_id"`
	Quantity int   `json:"quantity"`
	Position int   `json:"position"`
	Optional bool  `json:"optional"`
}

// GetAllRecipes returns public recipes
func (s *Service) GetAllRecipes() ([]RecipeInfo, error) {
	rows, err := s.db.Query(`
		SELECT id, name, description, success_rate, required_skill_level, crafting_time_ms
		FROM recipes
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recipes []RecipeInfo
	for rows.Next() {
		var r RecipeInfo
		if err := rows.Scan(&r.ID, &r.Name, &r.Description, &r.SuccessRate, &r.RequiredSkillLvl, &r.CraftingTimeMs); err != nil {
			return nil, err
		}

		// Get ingredients
		ingRows, err := s.db.Query(
			`SELECT item_template_id, quantity, position, optional FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY position`,
			r.ID,
		)
		if err != nil {
			return nil, err
		}
		defer ingRows.Close()

		var ingredients []IngredientInfo
		for ingRows.Next() {
			var ing IngredientInfo
			if err := ingRows.Scan(&ing.ItemID, &ing.Quantity, &ing.Position, &ing.Optional); err != nil {
				return nil, err
			}
			ingredients = append(ingredients, ing)
		}
		r.Ingredients = ingredients
		recipes = append(recipes, r)
	}

	return recipes, rows.Err()
}

// GetRecipe returns single recipe
func (s *Service) GetRecipe(recipeID int64) (*RecipeInfo, error) {
	var r RecipeInfo
	err := s.db.QueryRow(`
		SELECT id, name, description, success_rate, required_skill_level, crafting_time_ms
		FROM recipes WHERE id = $1
	`, recipeID).Scan(&r.ID, &r.Name, &r.Description, &r.SuccessRate, &r.RequiredSkillLvl, &r.CraftingTimeMs)

	if err == sql.ErrNoRows {
		return nil, errors.New("recipe not found")
	}
	if err != nil {
		return nil, err
	}

	// Get ingredients
	rows, err := s.db.Query(
		`SELECT item_template_id, quantity, position, optional FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY position`,
		recipeID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ingredients []IngredientInfo
	for rows.Next() {
		var ing IngredientInfo
		if err := rows.Scan(&ing.ItemID, &ing.Quantity, &ing.Position, &ing.Optional); err != nil {
			return nil, err
		}
		ingredients = append(ingredients, ing)
	}
	r.Ingredients = ingredients

	return &r, nil
}

// GetRecipeHint returns partial info for undiscovered recipe
func (s *Service) GetRecipeHint(recipeID int64) (string, error) {
	var hint string
	err := s.db.QueryRow(`SELECT hint FROM recipe_hints WHERE recipe_id = $1`, recipeID).Scan(&hint)
	if err == sql.ErrNoRows {
		return "", errors.New("hint not found")
	}
	return hint, err
}

// CraftRequest for crafting execution
type CraftRequest struct {
	RecipeID  int64   `json:"recipe_id"`
	Ingredient map[int64]int `json:"ingredients"`
}

// CraftResult after crafting
type CraftResult struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	XPGained  int    `json:"xp_gained"`
	ResultItem int64 `json:"result_item_id,omitempty"`
}

// Craft executes recipe and returns result
func (s *Service) Craft(userID, recipeID int64, ingredients map[int64]int) (*CraftResult, error) {
	// Get recipe
	var recipe RecipeInfo
	var resultItemID int64
	err := s.db.QueryRow(`
		SELECT id, name, success_rate, required_skill_level, crafting_time_ms, result_item_id
		FROM recipes WHERE id = $1
	`, recipeID).Scan(&recipe.ID, &recipe.Name, &recipe.SuccessRate, &recipe.RequiredSkillLvl, &recipe.CraftingTimeMs, &resultItemID)

	// Get user skill level
	var skillLvl int
	err = s.db.QueryRow(`SELECT crafting_skill_level FROM users WHERE id = $1`, userID).Scan(&skillLvl)
	if err != nil {
		return nil, err
	}

	// Check skill requirement
	if skillLvl < recipe.RequiredSkillLvl {
		return &CraftResult{
			Success: false,
			Message: fmt.Sprintf("Requires skill level %d", recipe.RequiredSkillLvl),
		}, nil
	}

	// Calculate success rate with skill modifier
	successChance := recipe.SuccessRate + (skillLvl - recipe.RequiredSkillLvl)
	if successChance > 100 {
		successChance = 100
	}
	if successChance < 0 {
		successChance = 0
	}

	success := rand.Intn(100) < successChance

	// XP calculation
	xpGain := 10 + (recipe.RequiredSkillLvl * 5)
	if !success {
		xpGain = xpGain / 2
	}

	// Log crafting attempt
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`INSERT INTO crafting_logs (user_id, recipe_id, success, xp_gained) VALUES ($1, $2, $3, $4)`,
		userID, recipeID, success, xpGain,
	)
	if err != nil {
		return nil, err
	}

	// Grant XP to user
	_, err = tx.Exec(
		`UPDATE users SET crafting_xp = crafting_xp + $1 WHERE id = $2`,
		xpGain, userID,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	msg := "Crafting failed"
	if success {
		msg = "Crafting succeeded"
	}

	return &CraftResult{
		Success:    success,
		Message:    msg,
		XPGained:   xpGain,
		ResultItem: resultItemID,
	}, nil
}

// DiscoverRecipe discovers a new recipe through experimental crafting
func (s *Service) DiscoverRecipe(userID, recipeID int64) (bool, error) {
	// Check if already discovered
	var exists bool
	err := s.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM player_recipes WHERE user_id = $1 AND recipe_id = $2)`,
		userID, recipeID,
	).Scan(&exists)
	if err != nil {
		return false, err
	}

	if exists {
		return false, errors.New("recipe already discovered")
	}

	// Add discovery
	_, err = s.db.Exec(
		`INSERT INTO player_recipes (user_id, recipe_id) VALUES ($1, $2)`,
		userID, recipeID,
	)
	return err == nil, err
}

// GetPlayerRecipes returns discovered recipes for user
func (s *Service) GetPlayerRecipes(userID int64) ([]RecipeInfo, error) {
	rows, err := s.db.Query(`
		SELECT r.id, r.name, r.description, r.success_rate, r.required_skill_level, r.crafting_time_ms
		FROM recipes r
		JOIN player_recipes pr ON r.id = pr.recipe_id
		WHERE pr.user_id = $1
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recipes []RecipeInfo
	for rows.Next() {
		var r RecipeInfo
		if err := rows.Scan(&r.ID, &r.Name, &r.Description, &r.SuccessRate, &r.RequiredSkillLvl, &r.CraftingTimeMs); err != nil {
			return nil, err
		}
		recipes = append(recipes, r)
	}

	return recipes, rows.Err()
}

// GetPlayerSkills returns user's crafting stats
type SkillsInfo struct {
	CraftingLevel int   `json:"crafting_level"`
	CraftingXP    int64 `json:"crafting_xp"`
	XPForNext     int64 `json:"xp_for_next_level"`
}

func (s *Service) GetPlayerSkills(userID int64) (*SkillsInfo, error) {
	var level int
	var xp int64
	err := s.db.QueryRow(
		`SELECT crafting_skill_level, crafting_xp FROM users WHERE id = $1`,
		userID,
	).Scan(&level, &xp)
	if err != nil {
		return nil, err
	}

	// Exponential XP curve: XP = 100 * level^1.5
	nextLevelXP := int64(100.0 * float64(level+1) * float64(level+1) * 1.5)

	return &SkillsInfo{
		CraftingLevel: level,
		CraftingXP:    xp,
		XPForNext:     nextLevelXP,
	}, nil
}

// AdminCreateRecipe creates new recipe
type CreateRecipeRequest struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	ResultItemID     int64  `json:"result_item_id"`
	SuccessRate      int    `json:"success_rate"`
	RequiredSkillLvl int    `json:"required_skill_level"`
	CraftingTimeMs   int    `json:"crafting_time_ms"`
	Discoverable     bool   `json:"discoverable"`
}

func (s *Service) AdminCreateRecipe(req CreateRecipeRequest) (int64, error) {
	var recipeID int64
	err := s.db.QueryRow(`
		INSERT INTO recipes (name, description, result_item_id, success_rate, required_skill_level, crafting_time_ms, discoverable)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, req.Name, req.Description, req.ResultItemID, req.SuccessRate, req.RequiredSkillLvl, req.CraftingTimeMs, req.Discoverable).Scan(&recipeID)

	return recipeID, err
}

// AdminCreateRecipeIngredient adds ingredient to recipe
type CreateIngredientRequest struct {
	ItemTemplateID int64 `json:"item_template_id"`
	Quantity       int   `json:"quantity"`
	Position       int   `json:"position"`
	Optional       bool  `json:"optional"`
}

func (s *Service) AdminCreateRecipeIngredient(recipeID int64, req CreateIngredientRequest) error {
	_, err := s.db.Exec(`
		INSERT INTO recipe_ingredients (recipe_id, item_template_id, quantity, position, optional)
		VALUES ($1, $2, $3, $4, $5)
	`, recipeID, req.ItemTemplateID, req.Quantity, req.Position, req.Optional)
	return err
}
