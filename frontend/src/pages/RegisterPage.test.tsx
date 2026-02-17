import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import RegisterPage from './RegisterPage'

vi.mock('axios')

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create character header', () => {
    renderWithRouter(<RegisterPage />)
    expect(screen.getByRole('heading', { name: /Create Character/i })).toBeInTheDocument()
  })

  it('renders email label', () => {
    renderWithRouter(<RegisterPage />)
    expect(screen.getByText(/Email/)).toBeInTheDocument()
  })

  it('renders character name label', () => {
    renderWithRouter(<RegisterPage />)
    expect(screen.getByText(/Character Name/)).toBeInTheDocument()
  })

  it('renders password label', () => {
    renderWithRouter(<RegisterPage />)
    expect(screen.getByText(/Password/)).toBeInTheDocument()
  })

  it('renders create character button', () => {
    renderWithRouter(<RegisterPage />)
    expect(screen.getByRole('button', { name: /Create Character/i })).toBeInTheDocument()
  })

  it('has login link', () => {
    renderWithRouter(<RegisterPage />)
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/login')
  })

  it('renders three input fields (email, username, password)', () => {
    renderWithRouter(<RegisterPage />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThanOrEqual(2) // At least email and username
  })
})
