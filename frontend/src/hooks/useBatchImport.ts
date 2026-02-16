import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '../store/auth'

export interface BatchImportPreview {
  items: ItemPreview[]
  recipes: RecipePreview[]
  summary: PreviewSummary
}

export interface ItemPreview {
  name: string
  action: string
  errors: string[]
}

export interface RecipePreview {
  name: string
  action: string
  errors: string[]
}

export interface PreviewSummary {
  items_create: number
  items_update: number
  items_error: number
  recipes_create: number
  recipes_update: number
  recipes_error: number
}

export interface BatchImportResult {
  items: ItemResult[]
  recipes: RecipeResult[]
  summary: ResultSummary
}

export interface ItemResult {
  name: string
  success: boolean
  action: string
  error: string
}

export interface RecipeResult {
  name: string
  success: boolean
  action: string
  error: string
}

export interface ResultSummary {
  items_created: number
  items_updated: number
  items_skipped: number
  recipes_created: number
  recipes_updated: number
  recipes_skipped: number
}

const API_BASE = '/api'

export function useBatchImportPreview() {
  const token = useAuthStore((state) => state.token)

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post(`${API_BASE}/admin/import/preview`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data as BatchImportPreview
    },
  })
}

export function useBatchImportExecute() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post(`${API_BASE}/admin/import/execute`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data as BatchImportResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] })
    },
  })
}
