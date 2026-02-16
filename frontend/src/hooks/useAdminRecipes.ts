import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '../store/auth'

export interface AdminRecipe {
  id: number
  name: string
  description: string
  result_item_id: number
  success_rate: number
  required_skill_level: number
  crafting_time_ms: number
  discoverable: boolean
  hints: string
}

export interface AdminIngredient {
  id: number
  item_id: number
  quantity: number
  position: number
}

export interface AdminRecipeDetail extends AdminRecipe {
  ingredients: AdminIngredient[]
}

export interface ItemTemplate {
  id: number
  name: string
  max_durability: number
  description: string
}

const API_BASE = '/api'

export function useAdminRecipes() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['admin-recipes'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/admin/recipes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data.recipes as AdminRecipe[]
    },
    enabled: !!token,
  })
}

export function useAdminRecipe(id: number | null) {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['admin-recipe', id],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/admin/recipes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data as AdminRecipeDetail
    },
    enabled: !!token && !!id,
  })
}

export function useItemTemplates() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['item-templates'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/admin/items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data.items as ItemTemplate[]
    },
    enabled: !!token,
  })
}

export function useCreateRecipe() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recipe: Omit<AdminRecipe, 'id'>) => {
      const res = await axios.post(`${API_BASE}/admin/recipes`, recipe, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] })
    },
  })
}

export function useUpdateRecipe(id: number) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recipe: Omit<AdminRecipe, 'id'>) => {
      const res = await axios.put(`${API_BASE}/admin/recipes/${id}`, recipe, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] })
      queryClient.invalidateQueries({ queryKey: ['admin-recipe', id] })
    },
  })
}

export function useDeleteRecipe() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_BASE}/admin/recipes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] })
    },
  })
}

export function useAddIngredient(recipeId: number) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ingredient: Omit<AdminIngredient, 'id'>) => {
      const res = await axios.post(
        `${API_BASE}/admin/recipes/${recipeId}/ingredients`,
        ingredient,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipe', recipeId] })
    },
  })
}

export function useUpdateIngredient(recipeId: number, ingredientId: number) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ingredient: Omit<AdminIngredient, 'id'>) => {
      const res = await axios.put(
        `${API_BASE}/admin/recipes/${recipeId}/ingredients/${ingredientId}`,
        ingredient,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipe', recipeId] })
    },
  })
}

export function useRemoveIngredient(recipeId: number) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ingredientId: number) => {
      await axios.delete(
        `${API_BASE}/admin/recipes/${recipeId}/ingredients/${ingredientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recipe', recipeId] })
    },
  })
}
