import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecipeBook from './RecipeBook'

// Mock auth store
vi.mock('../store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, username: 'TestUser', crafting_level: 10, is_admin: false },
  })),
}))

// Mock hooks
vi.mock('../hooks/useRecipes', () => ({
  useRecipes: vi.fn(() => ({
    data: [
      {
        id: 1,
        name: 'Iron Sword',
        description: 'A sword',
        required_skill_level: 1,
        success_rate: 80,
        crafting_time_ms: 2000,
        ingredients: [{ id: 1, item_id: 1, position: 0, quantity: 1, optional: false }]
      },
    ],
    isLoading: false,
  })),
  usePlayerRecipes: vi.fn(() => ({
    data: [{ id: 1 }],
  })),
  useRecipeHint: vi.fn(() => ({
    data: 'Try combining iron with carbon',
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

describe('RecipeBook', () => {
  it('renders filter section', () => {
    renderWithProviders(<RecipeBook />)
    expect(screen.getByText(/Filters/i)).toBeInTheDocument()
  })

  it('displays recipe list', () => {
    renderWithProviders(<RecipeBook />)
    expect(screen.getByText(/Iron Sword/)).toBeInTheDocument()
  })

  it('displays recipe names in list', () => {
    renderWithProviders(<RecipeBook />)
    expect(screen.getByText(/Iron Sword/)).toBeInTheDocument()
  })

  it('displays recipe count', () => {
    renderWithProviders(<RecipeBook />)
    expect(screen.getByText(/Found/i)).toBeInTheDocument()
  })

  it('shows sort controls', () => {
    renderWithProviders(<RecipeBook />)
    // Just check that selects are rendered
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThan(0)
  })
})
