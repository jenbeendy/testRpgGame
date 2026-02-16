import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '../store/auth'

export interface AdminItem {
  id: number
  name: string
  type: string
  rarity: string
  base_durability: number
  repair_cost: number
  repair_materials: Record<string, number>
  properties: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AdminItemDetail extends AdminItem {}

const API_BASE = '/api'

export function useAdminItems() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['admin-items'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/admin/items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data.items as AdminItem[]
    },
    enabled: !!token,
  })
}

export function useAdminItem(id: number | null) {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['admin-item', id],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/admin/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data as AdminItemDetail
    },
    enabled: !!token && !!id,
  })
}

export function useCreateItem() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      item: Omit<AdminItem, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const res = await axios.post(`${API_BASE}/admin/items`, item, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
    },
  })
}

export function useUpdateItem(id: number) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      item: Omit<AdminItem, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const res = await axios.put(`${API_BASE}/admin/items/${id}`, item, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
      queryClient.invalidateQueries({ queryKey: ['admin-item', id] })
    },
  })
}

export function useDeleteItem() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_BASE}/admin/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
    },
  })
}
