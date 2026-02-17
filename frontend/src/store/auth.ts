import { create } from 'zustand'

interface User {
  id: number
  email: string
  username: string
  is_admin: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  hydrate: () => void
}

// Initialize from localStorage with type safety
const getInitialState = () => ({
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null,
  user: typeof localStorage !== 'undefined'
    ? (() => {
        try {
          const u = localStorage.getItem('user')
          return u ? JSON.parse(u) : null
        } catch {
          return null
        }
      })()
    : null,
})

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialState(),

  setAuth: (token: string, user: User) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    set({ token, user })
    console.log('[Auth] User logged in:', user.id, user.email)
  },

  logout: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
    set({ token: null, user: null })
  },

  isAuthenticated: () => {
    return get().token !== null && get().user !== null
  },

  hydrate: () => {
    const state = getInitialState()
    set(state)
    if (state.user) {
      console.log('[Auth] Hydrated user:', state.user.id)
    }
  },
}))
