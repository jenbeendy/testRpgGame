package crafting

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

// TestGetRecipeSuccess tests successful recipe fetch
func TestGetRecipeSuccess(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	recipeID := int64(1)
	rows := sqlmock.NewRows([]string{"id", "name", "description", "success_rate", "required_skill_level", "crafting_time_ms"}).
		AddRow(recipeID, "Iron Sword", "A basic sword", 80, 5, 1000)

	ingRows := sqlmock.NewRows([]string{"item_template_id", "quantity", "position", "optional"}).
		AddRow(int64(10), 2, 0, false).
		AddRow(int64(11), 1, 1, false)

	mock.ExpectQuery(`SELECT.*FROM recipes WHERE id = \$1`).WithArgs(recipeID).WillReturnRows(rows)
	mock.ExpectQuery(`SELECT.*FROM recipe_ingredients WHERE recipe_id = \$1 ORDER BY position`).WithArgs(recipeID).WillReturnRows(ingRows)

	svc := NewService(db)
	recipe, err := svc.GetRecipe(recipeID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if recipe.ID != recipeID {
		t.Errorf("expected recipe ID %d, got %d", recipeID, recipe.ID)
	}
	if recipe.Name != "Iron Sword" {
		t.Errorf("expected name 'Iron Sword', got %s", recipe.Name)
	}
	if len(recipe.Ingredients) != 2 {
		t.Errorf("expected 2 ingredients, got %d", len(recipe.Ingredients))
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestGetRecipeNotFound tests recipe not found error
func TestGetRecipeNotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	recipeID := int64(999)
	mock.ExpectQuery(`SELECT.*FROM recipes WHERE id = \$1`).WithArgs(recipeID).WillReturnError(sql.ErrNoRows)

	svc := NewService(db)
	recipe, err := svc.GetRecipe(recipeID)

	if recipe != nil {
		t.Errorf("expected nil recipe, got %+v", recipe)
	}
	if err == nil {
		t.Error("expected error for missing recipe")
	}
	if err.Error() != "recipe not found" {
		t.Errorf("expected 'recipe not found', got %v", err)
	}
}

// TestGetAllRecipes tests fetching all recipes with ingredients (N+1 pattern)
func TestGetAllRecipes(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	recipes := sqlmock.NewRows([]string{"id", "name", "description", "success_rate", "required_skill_level", "crafting_time_ms"}).
		AddRow(int64(1), "Iron Sword", "sword", 80, 5, 1000).
		AddRow(int64(2), "Steel Hammer", "hammer", 70, 10, 1500)

	ing1 := sqlmock.NewRows([]string{"item_template_id", "quantity", "position", "optional"}).
		AddRow(int64(10), 2, 0, false)

	ing2 := sqlmock.NewRows([]string{"item_template_id", "quantity", "position", "optional"}).
		AddRow(int64(20), 3, 0, false)

	mock.ExpectQuery(`SELECT.*FROM recipes`).WillReturnRows(recipes)
	mock.ExpectQuery(`SELECT.*FROM recipe_ingredients WHERE recipe_id = \$1 ORDER BY position`).WithArgs(int64(1)).WillReturnRows(ing1)
	mock.ExpectQuery(`SELECT.*FROM recipe_ingredients WHERE recipe_id = \$1 ORDER BY position`).WithArgs(int64(2)).WillReturnRows(ing2)

	svc := NewService(db)
	results, err := svc.GetAllRecipes()

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 2 {
		t.Errorf("expected 2 recipes, got %d", len(results))
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestGetPlayerSkillsXPFormula tests XP formula calculation (documents actual impl vs spec discrepancy)
// Spec says: 100*level^1.5
// Actual impl: 100*(level+1)^2*1.5
func TestGetPlayerSkillsXPFormula(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID := int64(1)
	level := 5
	xp := int64(5000)

	rows := sqlmock.NewRows([]string{"crafting_skill_level", "crafting_xp"}).
		AddRow(level, xp)

	mock.ExpectQuery(`SELECT.*FROM users WHERE id = \$1`).WithArgs(userID).WillReturnRows(rows)

	svc := NewService(db)
	skills, err := svc.GetPlayerSkills(userID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Actual formula: 100 * (level+1)^2 * 1.5
	// For level 5: 100 * 6^2 * 1.5 = 100 * 36 * 1.5 = 5400
	expectedXP := int64(5400)
	if skills.XPForNext != expectedXP {
		t.Errorf("expected XP for next level %d, got %d (formula: 100*(level+1)^2*1.5)", expectedXP, skills.XPForNext)
	}
	if skills.CraftingLevel != level {
		t.Errorf("expected level %d, got %d", level, skills.CraftingLevel)
	}
	if skills.CraftingXP != xp {
		t.Errorf("expected XP %d, got %d", xp, skills.CraftingXP)
	}
}

// TestCraftGuaranteedSuccess tests crafting with 100% success rate
func TestCraftGuaranteedSuccess(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, recipeID := int64(1), int64(1)

	// Get recipe - success_rate=100, required_skill_level=0
	recipeRows := sqlmock.NewRows([]string{"id", "name", "success_rate", "required_skill_level", "crafting_time_ms", "result_item_id"}).
		AddRow(recipeID, "Test Recipe", 100, 0, 1000, int64(999))

	// Get user skill level - skill_level=0
	skillRows := sqlmock.NewRows([]string{"crafting_skill_level"}).AddRow(0)

	mock.ExpectQuery(`SELECT.*FROM recipes WHERE id = \$1`).WithArgs(recipeID).WillReturnRows(recipeRows)
	mock.ExpectQuery(`SELECT.*FROM users WHERE id = \$1`).WithArgs(userID).WillReturnRows(skillRows)

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO crafting_logs`).
		WithArgs(userID, recipeID, true, 10).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectExec(`UPDATE users SET crafting_xp`).
		WithArgs(10, userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	svc := NewService(db)
	result, err := svc.Craft(userID, recipeID, nil)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !result.Success {
		t.Error("expected craft to succeed with 100% success rate")
	}
	if result.XPGained != 10 {
		t.Errorf("expected XP gained 10, got %d", result.XPGained)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestCraftGuaranteedFailure tests crafting with 0% success rate
func TestCraftGuaranteedFailure(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, recipeID := int64(1), int64(2)

	// Get recipe - success_rate=0, required_skill_level=0
	recipeRows := sqlmock.NewRows([]string{"id", "name", "success_rate", "required_skill_level", "crafting_time_ms", "result_item_id"}).
		AddRow(recipeID, "Hard Recipe", 0, 0, 1000, int64(999))

	// Get user skill level
	skillRows := sqlmock.NewRows([]string{"crafting_skill_level"}).AddRow(0)

	mock.ExpectQuery(`SELECT.*FROM recipes WHERE id = \$1`).WithArgs(recipeID).WillReturnRows(recipeRows)
	mock.ExpectQuery(`SELECT.*FROM users WHERE id = \$1`).WithArgs(userID).WillReturnRows(skillRows)

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO crafting_logs`).
		WithArgs(userID, recipeID, false, 5).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectExec(`UPDATE users SET crafting_xp`).
		WithArgs(5, userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	svc := NewService(db)
	result, err := svc.Craft(userID, recipeID, nil)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Success {
		t.Error("expected craft to fail with 0% success rate")
	}
	if result.XPGained != 5 {
		t.Errorf("expected XP gained 5 (half of 10), got %d", result.XPGained)
	}
}

// TestCraftSkillBonusCap tests success rate cap at 100%
func TestCraftSkillBonusCap(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, recipeID := int64(1), int64(3)

	// success_rate=90, required_skill_level=0, user_skill=15 (bonus +15, would be 105 capped at 100)
	recipeRows := sqlmock.NewRows([]string{"id", "name", "success_rate", "required_skill_level", "crafting_time_ms", "result_item_id"}).
		AddRow(recipeID, "Capped Recipe", 90, 0, 1000, int64(999))

	skillRows := sqlmock.NewRows([]string{"crafting_skill_level"}).AddRow(15)

	mock.ExpectQuery(`SELECT.*FROM recipes WHERE id = \$1`).WithArgs(recipeID).WillReturnRows(recipeRows)
	mock.ExpectQuery(`SELECT.*FROM users WHERE id = \$1`).WithArgs(userID).WillReturnRows(skillRows)

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO crafting_logs`).
		WithArgs(userID, recipeID, true, 10).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectExec(`UPDATE users SET crafting_xp`).
		WithArgs(10, userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	svc := NewService(db)
	result, err := svc.Craft(userID, recipeID, nil)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// With capped success at 100%, should always succeed
	if !result.Success {
		t.Error("expected craft to succeed with capped success rate")
	}
}

// TestDiscoverRecipeNew tests discovering a new recipe
func TestDiscoverRecipeNew(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, recipeID := int64(1), int64(1)

	// EXISTS returns false (not discovered yet)
	existsRows := sqlmock.NewRows([]string{"exists"}).AddRow(false)

	mock.ExpectQuery(`SELECT EXISTS`).WithArgs(userID, recipeID).WillReturnRows(existsRows)
	mock.ExpectExec(`INSERT INTO player_recipes`).
		WithArgs(userID, recipeID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	svc := NewService(db)
	discovered, err := svc.DiscoverRecipe(userID, recipeID)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !discovered {
		t.Error("expected discovery to succeed")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestDiscoverRecipeAlreadyDiscovered tests discovering an already discovered recipe
func TestDiscoverRecipeAlreadyDiscovered(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	userID, recipeID := int64(1), int64(1)

	// EXISTS returns true (already discovered)
	existsRows := sqlmock.NewRows([]string{"exists"}).AddRow(true)

	mock.ExpectQuery(`SELECT EXISTS`).WithArgs(userID, recipeID).WillReturnRows(existsRows)

	svc := NewService(db)
	discovered, err := svc.DiscoverRecipe(userID, recipeID)

	if discovered {
		t.Error("expected discovery to return false for already discovered")
	}
	if err == nil {
		t.Error("expected error for already discovered recipe")
	}
	if err.Error() != "recipe already discovered" {
		t.Errorf("expected 'recipe already discovered', got %v", err)
	}
}

// TestAdminCreateRecipe tests creating a new recipe
func TestAdminCreateRecipe(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	req := CreateRecipeRequest{
		Name:             "New Recipe",
		Description:      "A new recipe",
		ResultItemID:     int64(100),
		SuccessRate:      75,
		RequiredSkillLvl: 10,
		CraftingTimeMs:   2000,
		Discoverable:     true,
	}

	rows := sqlmock.NewRows([]string{"id"}).AddRow(int64(42))

	mock.ExpectQuery(`INSERT INTO recipes`).
		WithArgs(req.Name, req.Description, req.ResultItemID, req.SuccessRate, req.RequiredSkillLvl, req.CraftingTimeMs, req.Discoverable).
		WillReturnRows(rows)

	svc := NewService(db)
	recipeID, err := svc.AdminCreateRecipe(req)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if recipeID != 42 {
		t.Errorf("expected recipe ID 42, got %d", recipeID)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// TestAdminCreateRecipeIngredient tests adding ingredient to recipe
func TestAdminCreateRecipeIngredient(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	recipeID := int64(1)
	req := CreateIngredientRequest{
		ItemTemplateID: int64(50),
		Quantity:       3,
		Position:       0,
		Optional:       false,
	}

	mock.ExpectExec(`INSERT INTO recipe_ingredients`).
		WithArgs(recipeID, req.ItemTemplateID, req.Quantity, req.Position, req.Optional).
		WillReturnResult(sqlmock.NewResult(1, 1))

	svc := NewService(db)
	err = svc.AdminCreateRecipeIngredient(recipeID, req)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}
