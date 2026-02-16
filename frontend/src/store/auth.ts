import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: { id: number; email: string; username: string; is_admin: boolean } | null
  setAuth: (token: string, user: any) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  setAuth: (token: string, user: any) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  isAuthenticated: () => {
    return get().token !== null
  }
}))
