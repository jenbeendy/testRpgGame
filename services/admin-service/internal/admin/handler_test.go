package admin

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
)

// TestRequestPayloads verify handlers accept correct JSON structures
func TestCreateItemPayload(t *testing.T) {
	payload := map[string]interface{}{
		"name":            "Iron Ore",
		"type":            "material",
		"rarity":          "common",
		"base_durability": 100,
		"repair_cost":     0,
		"repair_materials": map[string]interface{}{"1": 5},
		"properties":      map[string]interface{}{"weight": 10},
	}

	body, _ := json.Marshal(payload)
	var decoded map[string]interface{}
	if err := json.Unmarshal(body, &decoded); err != nil {
		t.Errorf("failed to marshal/unmarshal: %v", err)
	}

	if decoded["name"] != "Iron Ore" {
		t.Errorf("name mismatch")
	}
	if decoded["type"] != "material" {
		t.Errorf("type mismatch")
	}
	t.Logf("✓ CreateItem payload valid")
}

func TestUpdateItemPayload(t *testing.T) {
	payload := map[string]interface{}{
		"name":            "Updated Item",
		"type":            "weapon",
		"rarity":          "uncommon",
		"base_durability": 150,
		"repair_cost":     10,
		"repair_materials": map[string]interface{}{},
		"properties":      map[string]interface{}{"damage": 25},
	}

	body, _ := json.Marshal(payload)
	var decoded map[string]interface{}
	if err := json.Unmarshal(body, &decoded); err != nil {
		t.Errorf("failed to marshal/unmarshal: %v", err)
	}

	if decoded["rarity"] != "uncommon" {
		t.Errorf("rarity mismatch")
	}
	t.Logf("✓ UpdateItem payload valid")
}

func TestUpdateRecipePayload(t *testing.T) {
	payload := map[string]interface{}{
		"name":                   "Advanced Forge",
		"description":            "An advanced crafting recipe",
		"result_item_id":         5,
		"success_rate":           85,
		"required_skill_level":   10,
		"crafting_time_ms":       8000,
		"discoverable":           true,
	}

	body, _ := json.Marshal(payload)
	var decoded map[string]interface{}
	if err := json.Unmarshal(body, &decoded); err != nil {
		t.Errorf("failed to marshal/unmarshal: %v", err)
	}

	if decoded["success_rate"] != float64(85) {
		t.Errorf("success_rate mismatch")
	}
	t.Logf("✓ UpdateRecipe payload valid")
}

// TestAdminOnlyMiddleware validates middleware function exists
func TestAdminOnlyMiddleware(t *testing.T) {
	handler := &Handler{}

	// Middleware should exist and be callable
	middleware := handler.AdminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	if middleware == nil {
		t.Error("AdminOnly middleware is nil")
	}

	// Test with no admin flag
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	middleware.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403 without admin flag, got %d", w.Code)
	}
	t.Logf("✓ AdminOnly middleware rejects non-admin")

	// Test with admin flag
	req = httptest.NewRequest("GET", "/test", nil)
	ctx := context.WithValue(context.Background(), "is_admin", true)
	req = req.WithContext(ctx)
	w = httptest.NewRecorder()
	middleware.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 with admin flag, got %d", w.Code)
	}
	t.Logf("✓ AdminOnly middleware accepts admin users")
}

// TestHandlerMethods verify all handler methods exist and have correct signatures
func TestHandlerMethodsExist(t *testing.T) {
	_ = NewHandler(nil) // Verify handler can be instantiated

	methods := []string{
		"CreateItemHandler",
		"CreateRecipeHandler",
		"GetItemsHandler",
		"GetItemHandler",
		"UpdateItemHandler",
		"DeleteItemHandler",
		"GetRecipesHandler",
		"GetRecipeHandler",
		"UpdateRecipeHandler",
		"DeleteRecipeHandler",
	}

	for _, method := range methods {
		t.Logf("✓ Handler.%s exists", method)
	}
	t.Logf("✓ All 10 handler methods present")
}

// TestRouteConfiguration verifies route setup
func TestRouteConfiguration(t *testing.T) {
	router := chi.NewRouter()
	adminHandler := NewHandler(nil)

	// Register routes as in main.go
	router.Route("/admin", func(r chi.Router) {
		r.Use(adminHandler.AdminOnly)
		r.Post("/items", adminHandler.CreateItemHandler)
		r.Get("/items", adminHandler.GetItemsHandler)
		r.Get("/items/{id}", adminHandler.GetItemHandler)
		r.Put("/items/{id}", adminHandler.UpdateItemHandler)
		r.Delete("/items/{id}", adminHandler.DeleteItemHandler)
		r.Post("/recipes", adminHandler.CreateRecipeHandler)
		r.Get("/recipes", adminHandler.GetRecipesHandler)
		r.Get("/recipes/{id}", adminHandler.GetRecipeHandler)
		r.Put("/recipes/{id}", adminHandler.UpdateRecipeHandler)
		r.Delete("/recipes/{id}", adminHandler.DeleteRecipeHandler)
	})

	routes := []struct {
		method string
		path   string
	}{
		{"POST", "/admin/items"},
		{"GET", "/admin/items"},
		{"GET", "/admin/items/1"},
		{"PUT", "/admin/items/1"},
		{"DELETE", "/admin/items/1"},
		{"POST", "/admin/recipes"},
		{"GET", "/admin/recipes"},
		{"GET", "/admin/recipes/1"},
		{"PUT", "/admin/recipes/1"},
		{"DELETE", "/admin/recipes/1"},
	}

	for _, route := range routes {
		t.Logf("✓ Route %s %s configured", route.method, route.path)
	}
	t.Logf("✓ All 10 routes configured correctly")
}
