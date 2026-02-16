import { create } from 'zustand'

export interface PendingIngredient {
  item_id: number
  quantity: number
  position: number
}

interface AdminState {
  selectedRecipeId: number | null
  formMode: 'create' | 'edit'
  filters: { searchText: string; sortBy: 'name' | 'skill' }
  pendingIngredients: PendingIngredient[]
  selectRecipe: (id: number | null) => void
  setFormMode: (mode: 'create' | 'edit') => void
  setFilters: (filters: Partial<AdminState['filters']>) => void
  addPendingIngredient: (ingredient: PendingIngredient) => void
  updatePendingIngredient: (index: number, ingredient: PendingIngredient) => void
  removePendingIngredient: (index: number) => void
  reorderIngredients: (oldIdx: number, newIdx: number) => void
  reset: () => void
}

export const useAdminStore = create<AdminState>((set) => ({
  selectedRecipeId: null,
  formMode: 'create',
  filters: { searchText: '', sortBy: 'name' },
  pendingIngredients: [],

  selectRecipe: (id) => set({ selectedRecipeId: id }),
  setFormMode: (mode) => set({ formMode: mode }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  addPendingIngredient: (ingredient) =>
    set((state) => ({
      pendingIngredients: [...state.pendingIngredients, ingredient],
    })),

  updatePendingIngredient: (index, ingredient) =>
    set((state) => {
      const updated = [...state.pendingIngredients]
      updated[index] = ingredient
      return { pendingIngredients: updated }
    }),

  removePendingIngredient: (index) =>
    set((state) => ({
      pendingIngredients: state.pendingIngredients.filter((_, i) => i !== index),
    })),

  reorderIngredients: (oldIdx, newIdx) =>
    set((state) => {
      const updated = [...state.pendingIngredients]
      const [item] = updated.splice(oldIdx, 1)
      updated.splice(newIdx, 0, item)
      return { pendingIngredients: updated }
    }),

  reset: () =>
    set({
      selectedRecipeId: null,
      formMode: 'create',
      pendingIngredients: [],
    }),
}))
