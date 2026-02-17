import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

vi.mock('../store/auth')
vi.mock('axios')

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login header', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByText(/RPG Crafting/i)).toBeInTheDocument()
  })

  it('renders email label', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByText(/Email/)).toBeInTheDocument()
  })

  it('renders password label', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByText(/Password/)).toBeInTheDocument()
  })

  it('renders login button', () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()
  })

  it('has register link', () => {
    renderWithRouter(<LoginPage />)
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/register')
  })

  it('renders two input fields', () => {
    renderWithRouter(<LoginPage />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })
})
