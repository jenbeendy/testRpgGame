import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from './DashboardPage'

vi.mock('../components/InventoryDisplay', () => ({ default: () => <div>Inventory</div> }))
vi.mock('../components/RecipeBook', () => ({ default: () => <div>Recipes</div> }))
vi.mock('../components/CraftingInterface', () => ({ default: () => <div>Crafting</div> }))
vi.mock('../store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, username: 'TestUser', crafting_level: 10 },
    logout: vi.fn(),
  })),
}))
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: { crafting_level: 10, crafting_xp: 50, xp_for_next_level: 100 }, isLoading: false })),
  }
})

const queryClient = new QueryClient()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  it('renders crafting realm header', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText(/Crafting Realm/i)).toBeInTheDocument()
  })

  it('displays character stats section', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText(/Character/)).toBeInTheDocument()
  })

  it('renders all tabs', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })

  it('displays logout button', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
  })

  it('shows inventory by default', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('Inventory')).toBeInTheDocument()
  })
})
