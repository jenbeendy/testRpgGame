import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface Ingredient {
  item_id: number
  quantity: number
  position: number
  optional: boolean
}

export interface Recipe {
  id: number
  name: string
  description: string
  success_rate: number
  required_skill_level: number
  crafting_time_ms: number
  ingredients: Ingredient[]
}

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const res = await axios.get('/api/recipes')
      return res.data.recipes as Recipe[]
    },
  })
}

export function usePlayerRecipes(userId: number) {
  return useQuery({
    queryKey: ['player-recipes', userId],
    queryFn: async () => {
      const res = await axios.get(`/api/player-recipes/${userId}`)
      return res.data.recipes as Recipe[]
    },
  })
}

export function useRecipeHint(recipeId: number) {
  return useQuery({
    queryKey: ['recipe-hint', recipeId],
    queryFn: async () => {
      const res = await axios.get(`/api/recipes/${recipeId}/hint`)
      return res.data.hint as string
    },
  })
}
