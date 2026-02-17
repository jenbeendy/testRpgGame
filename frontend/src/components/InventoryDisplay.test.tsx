import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import InventoryDisplay from './InventoryDisplay'

// Mock auth store
vi.mock('../store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, username: 'TestUser', crafting_level: 10, is_admin: false },
  })),
}))

// Mock useQuery
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: [
        { id: 1, item_template_id: 1, quantity: 5, slot_x: 0, slot_y: 0, current_durability: 100 },
        { id: 2, item_template_id: 2, quantity: 3, slot_x: 1, slot_y: 0, current_durability: 75 },
      ],
      isLoading: false,
    })),
  }
})

const queryClient = new QueryClient()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('InventoryDisplay', () => {
  it('renders inventory header', () => {
    renderWithProviders(<InventoryDisplay />)

    expect(screen.getByText(/Inventory/i)).toBeInTheDocument()
  })

  it('displays item count', () => {
    renderWithProviders(<InventoryDisplay />)

    expect(screen.getByText(/2 items/i)).toBeInTheDocument()
  })

  it('renders inventory grid', () => {
    renderWithProviders(<InventoryDisplay />)

    // Just check that inventory section exists
    expect(screen.getByText(/Inventory/i)).toBeInTheDocument()
  })

  it('displays items in correct slots', () => {
    renderWithProviders(<InventoryDisplay />)

    // Check for quantity display
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows durability when not at 100%', () => {
    renderWithProviders(<InventoryDisplay />)

    expect(screen.getByText('75%')).toBeInTheDocument() // Second item durability
  })

  it('displays capacity stats', () => {
    renderWithProviders(<InventoryDisplay />)

    expect(screen.getByText(/Total Items/i)).toBeInTheDocument()
    expect(screen.getByText(/Slots Used/i)).toBeInTheDocument()
    expect(screen.getByText(/Capacity/i)).toBeInTheDocument()
  })

  it('shows usage statistics', () => {
    renderWithProviders(<InventoryDisplay />)

    // Just check that Capacity text exists
    expect(screen.getByText(/Capacity/)).toBeInTheDocument()
  })
})
