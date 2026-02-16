package models

import (
	"database/sql/driver"
	"time"
)

// User represents a player account
type User struct {
	ID               int64     `json:"id"`
	Email            string    `json:"email"`
	Username         string    `json:"username"`
	PasswordHash     string    `json:"-"`
	CraftingSkillLvl int       `json:"crafting_skill_level"`
	CraftingXP       int64     `json:"crafting_xp"`
	IsAdmin          bool      `json:"is_admin"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// ItemTemplate is a static item definition
type ItemTemplate struct {
	ID              int64           `json:"id"`
	Name            string          `json:"name"`
	Type            string          `json:"type"` // weapon, armor, material, etc
	Rarity          string          `json:"rarity"`
	BaseDurability  int             `json:"base_durability"`
	RepairCost      int             `json:"repair_cost"`
	RepairMaterials JSONB           `json:"repair_materials"` // map of material_id -> quantity
	Properties      JSONB           `json:"properties"`       // flexible attributes
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

// InventoryItem is a player's item instance
type InventoryItem struct {
	ID              int64     `json:"id"`
	InventoryID     int64     `json:"inventory_id"`
	ItemTemplateID  int64     `json:"item_template_id"`
	Quantity        int       `json:"quantity"`
	SlotX           int       `json:"slot_x"`
	SlotY           int       `json:"slot_y"`
	CurrentDurable  int       `json:"current_durability"`
	LastDecayCheck  time.Time `json:"last_decay_check"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Inventory is a player's item container
type Inventory struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	MaxSlots  int       `json:"max_slots"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Recipe is a crafting formula
type Recipe struct {
	ID              int64           `json:"id"`
	Name            string          `json:"name"`
	Description     string          `json:"description"`
	ResultItemID    int64           `json:"result_item_id"`
	SuccessRate     int             `json:"success_rate"` // 0-100%
	RequiredSkillLvl int            `json:"required_skill_level"`
	CraftingTimeMs  int             `json:"crafting_time_ms"`
	ChainStep       int             `json:"chain_step"` // 1-3, for tracking depth
	Discoverable    bool            `json:"discoverable"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

// RecipeIngredient is an ingredient in a recipe
type RecipeIngredient struct {
	ID              int64  `json:"id"`
	RecipeID        int64  `json:"recipe_id"`
	ItemTemplateID  int64  `json:"item_template_id"`
	Quantity        int    `json:"quantity"`
	Position        int    `json:"position"` // order matters
	Optional        bool   `json:"optional"`
	CreatedAt       time.Time `json:"created_at"`
}

// RecipeHint shows partial info for undiscovered recipes
type RecipeHint struct {
	ID       int64     `json:"id"`
	RecipeID int64     `json:"recipe_id"`
	Hint     string    `json:"hint"` // e.g. "Combine fire + metal..."
	CreatedAt time.Time `json:"created_at"`
}

// PlayerRecipe tracks discovered recipes per user
type PlayerRecipe struct {
	ID           int64     `json:"id"`
	UserID       int64     `json:"user_id"`
	RecipeID     int64     `json:"recipe_id"`
	TimesCrafted int       `json:"times_crafted"`
	DiscoveredAt time.Time `json:"discovered_at"`
	CreatedAt    time.Time `json:"created_at"`
}

// CraftingLog is an audit trail
type CraftingLog struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	RecipeID  int64     `json:"recipe_id"`
	Success   bool      `json:"success"`
	XPGained  int       `json:"xp_gained"`
	CreatedAt time.Time `json:"created_at"`
}

// JSONB custom type for PostgreSQL JSONB
type JSONB []byte

// Scan implements sql.Scanner
func (j *JSONB) Scan(value interface{}) error {
	bytes, _ := value.([]byte)
	*j = JSONB(bytes)
	return nil
}

// Value implements driver.Valuer
func (j JSONB) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return string(j), nil
}

// UnmarshalJSON for parsing JSON
func (j *JSONB) UnmarshalJSON(data []byte) error {
	*j = JSONB(data)
	return nil
}

// MarshalJSON for outputting JSON
func (j JSONB) MarshalJSON() ([]byte, error) {
	return j, nil
}

// Token type for JWT
type Claims struct {
	UserID   int64  `json:"user_id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	IsAdmin  bool   `json:"is_admin"`
}
