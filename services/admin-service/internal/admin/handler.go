package admin

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/rpgGame/pkg/models"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// AdminOnly middleware checks is_admin flag
func (h *Handler) AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		isAdmin := r.Context().Value("is_admin")
		if isAdmin == nil || !isAdmin.(bool) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// CreateRecipeHandler POST /admin/recipes
func (h *Handler) CreateRecipeHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name             string `json:"name"`
		Description      string `json:"description"`
		ResultItemID     int64  `json:"result_item_id"`
		SuccessRate      int    `json:"success_rate"`
		RequiredSkillLvl int    `json:"required_skill_level"`
		CraftingTimeMs   int    `json:"crafting_time_ms"`
		Discoverable     bool   `json:"discoverable"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	recipeID, err := h.service.CreateRecipe(req.Name, req.Description, req.ResultItemID, req.SuccessRate, req.RequiredSkillLvl, req.CraftingTimeMs, req.Discoverable)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int64{"id": recipeID})
}

// CreateItemHandler POST /admin/items
func (h *Handler) CreateItemHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name            string                 `json:"name"`
		Type            string                 `json:"type"`
		Rarity          string                 `json:"rarity"`
		BaseDurability  int                    `json:"base_durability"`
		RepairCost      int                    `json:"repair_cost"`
		RepairMaterials map[string]interface{} `json:"repair_materials"`
		Properties      map[string]interface{} `json:"properties"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// Encode JSONB fields
	repairMatBytes, _ := json.Marshal(req.RepairMaterials)
	propBytes, _ := json.Marshal(req.Properties)

	itemID, err := h.service.CreateItem(req.Name, req.Type, req.Rarity, req.BaseDurability, req.RepairCost, models.JSONB(repairMatBytes), models.JSONB(propBytes))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int64{"id": itemID})
}

// DeleteRecipeHandler DELETE /admin/recipes/:id
func (h *Handler) DeleteRecipeHandler(w http.ResponseWriter, r *http.Request) {
	recipeID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid recipe id", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteRecipe(recipeID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// GetRecipesHandler GET /admin/recipes
func (h *Handler) GetRecipesHandler(w http.ResponseWriter, r *http.Request) {
	recipes, err := h.service.GetRecipes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string][]models.Recipe{"recipes": recipes})
}

// GetRecipeHandler GET /admin/recipes/:id
func (h *Handler) GetRecipeHandler(w http.ResponseWriter, r *http.Request) {
	recipeID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid recipe id", http.StatusBadRequest)
		return
	}

	recipe, err := h.service.GetRecipe(recipeID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recipe)
}

// UpdateRecipeHandler PUT /admin/recipes/:id
func (h *Handler) UpdateRecipeHandler(w http.ResponseWriter, r *http.Request) {
	recipeID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid recipe id", http.StatusBadRequest)
		return
	}

	var req struct {
		Name             string `json:"name"`
		Description      string `json:"description"`
		ResultItemID     int64  `json:"result_item_id"`
		SuccessRate      int    `json:"success_rate"`
		RequiredSkillLvl int    `json:"required_skill_level"`
		CraftingTimeMs   int    `json:"crafting_time_ms"`
		Discoverable     bool   `json:"discoverable"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateRecipe(recipeID, req.Name, req.Description, req.ResultItemID, req.SuccessRate, req.RequiredSkillLvl, req.CraftingTimeMs, req.Discoverable); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

// DeleteItemHandler DELETE /admin/items/:id
func (h *Handler) DeleteItemHandler(w http.ResponseWriter, r *http.Request) {
	itemID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid item id", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteItem(itemID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// GetItemsHandler GET /admin/items
func (h *Handler) GetItemsHandler(w http.ResponseWriter, r *http.Request) {
	items, err := h.service.GetItems()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string][]models.ItemTemplate{"items": items})
}

// GetItemHandler GET /admin/items/:id
func (h *Handler) GetItemHandler(w http.ResponseWriter, r *http.Request) {
	itemID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid item id", http.StatusBadRequest)
		return
	}

	item, err := h.service.GetItem(itemID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

// UpdateItemHandler PUT /admin/items/:id
func (h *Handler) UpdateItemHandler(w http.ResponseWriter, r *http.Request) {
	itemID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid item id", http.StatusBadRequest)
		return
	}

	var req struct {
		Name            string                 `json:"name"`
		Type            string                 `json:"type"`
		Rarity          string                 `json:"rarity"`
		BaseDurability  int                    `json:"base_durability"`
		RepairCost      int                    `json:"repair_cost"`
		RepairMaterials map[string]interface{} `json:"repair_materials"`
		Properties      map[string]interface{} `json:"properties"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// Encode JSONB fields
	repairMatBytes, _ := json.Marshal(req.RepairMaterials)
	propBytes, _ := json.Marshal(req.Properties)

	if err := h.service.UpdateItem(itemID, req.Name, req.Type, req.Rarity, req.BaseDurability, req.RepairCost, models.JSONB(repairMatBytes), models.JSONB(propBytes)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

// PreviewBatchImportHandler POST /admin/import/preview
func (h *Handler) PreviewBatchImportHandler(w http.ResponseWriter, r *http.Request) {
	var req BatchImportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	preview, err := h.service.PreviewBatchImport(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(preview)
}

// ExecuteBatchImportHandler POST /admin/import/execute
func (h *Handler) ExecuteBatchImportHandler(w http.ResponseWriter, r *http.Request) {
	var req BatchImportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	result, err := h.service.ExecuteBatchImport(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
