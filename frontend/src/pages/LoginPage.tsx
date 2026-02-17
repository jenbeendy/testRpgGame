import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import axios from 'axios'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axios.post('/api/auth/login', { email, password })
      setAuth(res.data.access_token, { email })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gaming-dark">
      <div className="w-full max-w-md gaming-card">
        <h1 className="gaming-header text-4xl mb-2 text-center">RPG Crafting</h1>
        <p className="text-gaming-cyan text-center text-sm mb-8">Enter the realm</p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gaming-cyan text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="gaming-input"
              required
            />
          </div>
          <div>
            <label className="block text-gaming-cyan text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="gaming-input"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="gaming-button w-full"
          >
            {loading ? '⏳ Logging in...' : '⚔️ Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          No account? <Link to="/register" className="text-gaming-cyan hover:text-gaming-gold font-semibold transition-colors">Create one</Link>
        </p>
      </div>
    </div>
  )
}
