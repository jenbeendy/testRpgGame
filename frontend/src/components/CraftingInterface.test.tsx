import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CraftingInterface from './CraftingInterface'

vi.mock('../store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, username: 'TestUser', crafting_level: 10, is_admin: false },
  })),
}))

vi.mock('../hooks/useRecipes', () => ({
  useRecipes: vi.fn(() => ({
    data: [
      { id: 1, name: 'Iron Sword', description: 'A sword', required_skill_level: 1, success_rate: 80, crafting_time_ms: 2000, ingredients: [] },
      { id: 2, name: 'Steel Sword', description: 'Steel', required_skill_level: 5, success_rate: 70, crafting_time_ms: 3000, ingredients: [] },
    ],
    isLoading: false,
  })),
}))

const queryClient = new QueryClient()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('CraftingInterface', () => {
  it('renders available recipes section', () => {
    renderWithProviders(<CraftingInterface />)
    expect(screen.getByText(/Available Recipes/i)).toBeInTheDocument()
  })

  it('displays recipe names', () => {
    renderWithProviders(<CraftingInterface />)
    expect(screen.getByText(/Iron Sword/)).toBeInTheDocument()
    expect(screen.getByText(/Steel Sword/)).toBeInTheDocument()
  })

  it('shows placeholder when no recipe selected', () => {
    renderWithProviders(<CraftingInterface />)
    expect(screen.getByText(/Select a recipe/i)).toBeInTheDocument()
  })

  it('shows available recipes list', () => {
    renderWithProviders(<CraftingInterface />)
    expect(screen.getByText(/Available Recipes/i)).toBeInTheDocument()
  })
})
