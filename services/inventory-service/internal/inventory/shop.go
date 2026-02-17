package inventory

import (
	"encoding/json"
)

// ShopItem represents an item for sale
type ShopItem struct {
	ItemID   int64  `json:"item_id"`
	Name     string `json:"name"`
	Price    int64  `json:"price"`
}

// GetShopCatalog returns all available shop items
func (s *Service) GetShopCatalog() []ShopItem {
	items := []ShopItem{
		{ItemID: 1, Name: "Copper Ore", Price: 5},
		{ItemID: 2, Name: "Iron Ore", Price: 10},
		{ItemID: 3, Name: "Gold Ore", Price: 25},
		{ItemID: 5, Name: "Wood Log", Price: 5},
		{ItemID: 7, Name: "Leather Scrap", Price: 8},
		{ItemID: 9, Name: "Coal", Price: 8},
		{ItemID: 17, Name: "String", Price: 5},
		{ItemID: 19, Name: "Cloth", Price: 6},
		{ItemID: 21, Name: "Copper Ingot", Price: 20},
		{ItemID: 22, Name: "Iron Ingot", Price: 35},
		{ItemID: 11, Name: "Water Essence", Price: 15},
		{ItemID: 12, Name: "Fire Essence", Price: 15},
		{ItemID: 13, Name: "Earth Essence", Price: 15},
		{ItemID: 14, Name: "Air Essence", Price: 15},
	}
	return items
}

// CatalogJSON for responses
func (s *Service) CatalogJSON() string {
	catalog := s.GetShopCatalog()
	data, _ := json.Marshal(catalog)
	return string(data)
}
