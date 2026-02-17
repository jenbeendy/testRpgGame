package inventory

import (
	"database/sql"
	"errors"
	"math/rand"
	"time"
)

// Zone definitions with item pools and gold rewards
type ZoneConfig struct {
	Name      string
	ItemPool  []int64
	GoldMin   int
	GoldMax   int
}

var zones = map[string]ZoneConfig{
	"mine": {
		Name:     "mine",
		ItemPool: []int64{1, 2, 3, 9, 15}, // Copper, Iron, Gold, Coal, Crystal Shard
		GoldMin:  8,
		GoldMax:  18,
	},
	"forest": {
		Name:     "forest",
		ItemPool: []int64{5, 7, 17, 18, 19}, // Wood Log, Leather Scrap, String, Rope, Cloth
		GoldMin:  5,
		GoldMax:  12,
	},
	"plains": {
		Name:     "plains",
		ItemPool: []int64{7, 8, 13, 19}, // Leather Scrap, Fine Leather, Earth Essence, Cloth
		GoldMin:  5,
		GoldMax:  15,
	},
	"magic": {
		Name:     "magic",
		ItemPool: []int64{11, 12, 13, 14, 15, 16}, // Water, Fire, Earth, Air Essence, Crystal, Pure Crystal
		GoldMin:  15,
		GoldMax:  30,
	},
}

type GatherResult struct {
	Items              []GatherItem `json:"items"`
	GoldEarned         int          `json:"gold_earned"`
	SecondsRemaining   int          `json:"seconds_remaining"`
}

type GatherItem struct {
	ItemTemplateID int64  `json:"item_template_id"`
	Name           string `json:"name"`
	Quantity       int    `json:"quantity"`
}

// Gather performs zone-based gathering with cooldown checks
func (s *Service) Gather(userID int64, zone string) (*GatherResult, error) {
	zoneConfig, ok := zones[zone]
	if !ok {
		return nil, errors.New("invalid zone")
	}

	// Check cooldown
	var lastGatherStr sql.NullTime
	err := s.db.QueryRow(
		`SELECT last_gather_at FROM gather_cooldowns WHERE user_id = $1 AND zone = $2`,
		userID, zone,
	).Scan(&lastGatherStr)

	if err == nil && lastGatherStr.Valid {
		elapsed := time.Since(lastGatherStr.Time)
		cooldown := 30 * time.Second
		if elapsed < cooldown {
			secondsRemaining := int((cooldown - elapsed) / time.Second)
			return &GatherResult{SecondsRemaining: secondsRemaining}, errors.New("on cooldown")
		}
	} else if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// Roll items: 1-3 items, each qty 1-3
	numItems := rand.Intn(3) + 1
	gatheredItems := []GatherItem{}
	gatherMap := make(map[int64]int) // For deduplication

	for i := 0; i < numItems; i++ {
		itemID := zoneConfig.ItemPool[rand.Intn(len(zoneConfig.ItemPool))]
		qty := rand.Intn(3) + 1
		gatherMap[itemID] += qty
	}

	// Add items to inventory
	for itemID, qty := range gatherMap {
		if err := s.AddItem(userID, itemID, qty); err != nil {
			return nil, err
		}
		// Fetch item name (hardcoded map in handler will display this)
		gatheredItems = append(gatheredItems, GatherItem{
			ItemTemplateID: itemID,
			Quantity:       qty,
		})
	}

	// Calculate gold reward
	goldEarned := rand.Intn(zoneConfig.GoldMax-zoneConfig.GoldMin+1) + zoneConfig.GoldMin

	// Add gold to user
	_, err = s.db.Exec(
		`UPDATE users SET gold = gold + $1 WHERE id = $2`,
		goldEarned, userID,
	)
	if err != nil {
		return nil, err
	}

	// Upsert cooldown
	_, err = s.db.Exec(`
		INSERT INTO gather_cooldowns (user_id, zone, last_gather_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (user_id, zone) DO UPDATE SET last_gather_at = NOW()
	`, userID, zone)
	if err != nil {
		return nil, err
	}

	return &GatherResult{
		Items:            gatheredItems,
		GoldEarned:       goldEarned,
		SecondsRemaining: 0,
	}, nil
}

// GetGold returns user's current gold
func (s *Service) GetGold(userID int64) (int64, error) {
	var gold int64
	err := s.db.QueryRow(`SELECT gold FROM users WHERE id = $1`, userID).Scan(&gold)
	return gold, err
}

// ShopCatalog defines item prices
var ShopCatalog = map[int64]int64{
	1:  5,   // Copper Ore
	2:  10,  // Iron Ore
	3:  25,  // Gold Ore
	5:  5,   // Wood Log
	7:  8,   // Leather Scrap
	9:  8,   // Coal
	17: 5,   // String
	19: 6,   // Cloth
	21: 20,  // Copper Ingot
	22: 35,  // Iron Ingot
	11: 15,  // Water Essence
	12: 15,  // Fire Essence
	13: 15,  // Earth Essence
	14: 15,  // Air Essence
}

type BuyResult struct {
	GoldRemaining int64 `json:"gold_remaining"`
	ItemID        int64 `json:"item_template_id"`
	Quantity      int   `json:"quantity"`
}

// BuyItem purchases item with gold
func (s *Service) BuyItem(userID int64, itemID int64, qty int) (*BuyResult, error) {
	price, ok := ShopCatalog[itemID]
	if !ok {
		return nil, errors.New("item not in shop")
	}

	totalCost := price * int64(qty)

	// Atomic deduct + add item
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Check and deduct gold in one query
	var goldRemaining int64
	err = tx.QueryRow(
		`UPDATE users SET gold = gold - $1 WHERE id = $2 AND gold >= $1 RETURNING gold`,
		totalCost, userID,
	).Scan(&goldRemaining)

	if err == sql.ErrNoRows {
		return nil, errors.New("insufficient gold")
	}
	if err != nil {
		return nil, err
	}

	// Add item (using tx version)
	for i := 0; i < qty; i++ {
		var itemInvID int64
		// Try to find existing stack
		err := tx.QueryRow(
			`SELECT id FROM inventory_items WHERE user_id = $1 AND item_template_id = $2 ORDER BY id LIMIT 1`,
			userID, itemID,
		).Scan(&itemInvID)

		if err == nil {
			// Update existing
			_, err := tx.Exec(
				`UPDATE inventory_items SET quantity = quantity + 1 WHERE id = $1`,
				itemInvID,
			)
			if err != nil {
				return nil, err
			}
		} else if err == sql.ErrNoRows {
			// Insert new
			_, err := tx.Exec(
				`INSERT INTO inventory_items (user_id, item_template_id, quantity, slot_x, slot_y, durability_current, durability_max)
				VALUES ($1, $2, 1, -1, -1, 100, 100)`,
				userID, itemID,
			)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &BuyResult{
		GoldRemaining: goldRemaining,
		ItemID:        itemID,
		Quantity:      qty,
	}, nil
}
