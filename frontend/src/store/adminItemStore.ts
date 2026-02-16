import { create } from 'zustand'

export interface PendingProperty {
  key: string
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean'
}

export interface PendingRepairMaterial {
  item_id: number
  quantity: number
}

interface AdminItemState {
  selectedItemId: number | null
  formMode: 'create' | 'edit'
  filters: {
    searchText: string
    type: string
    rarity: string
    sortBy: 'name' | 'type' | 'rarity'
  }
  pendingProperties: PendingProperty[]
  pendingRepairMaterials: PendingRepairMaterial[]

  selectItem: (id: number | null) => void
  setFormMode: (mode: 'create' | 'edit') => void
  setFilters: (filters: Partial<AdminItemState['filters']>) => void
  addProperty: (prop: PendingProperty) => void
  updateProperty: (index: number, prop: PendingProperty) => void
  removeProperty: (index: number) => void
  addRepairMaterial: (material: PendingRepairMaterial) => void
  updateRepairMaterial: (index: number, material: PendingRepairMaterial) => void
  removeRepairMaterial: (index: number) => void
  reset: () => void
}

export const useAdminItemStore = create<AdminItemState>((set) => ({
  selectedItemId: null,
  formMode: 'create',
  filters: { searchText: '', type: '', rarity: '', sortBy: 'name' },
  pendingProperties: [],
  pendingRepairMaterials: [],

  selectItem: (id) => set({ selectedItemId: id }),
  setFormMode: (mode) => set({ formMode: mode }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  addProperty: (prop) =>
    set((state) => ({
      pendingProperties: [...state.pendingProperties, prop],
    })),

  updateProperty: (index, prop) =>
    set((state) => {
      const updated = [...state.pendingProperties]
      updated[index] = prop
      return { pendingProperties: updated }
    }),

  removeProperty: (index) =>
    set((state) => ({
      pendingProperties: state.pendingProperties.filter((_, i) => i !== index),
    })),

  addRepairMaterial: (material) =>
    set((state) => ({
      pendingRepairMaterials: [...state.pendingRepairMaterials, material],
    })),

  updateRepairMaterial: (index, material) =>
    set((state) => {
      const updated = [...state.pendingRepairMaterials]
      updated[index] = material
      return { pendingRepairMaterials: updated }
    }),

  removeRepairMaterial: (index) =>
    set((state) => ({
      pendingRepairMaterials: state.pendingRepairMaterials.filter(
        (_, i) => i !== index
      ),
    })),

  reset: () =>
    set({
      selectedItemId: null,
      formMode: 'create',
      pendingProperties: [],
      pendingRepairMaterials: [],
    }),
}))
