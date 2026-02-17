import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post('/api/auth/register', { email, username, password })
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gaming-dark">
      <div className="w-full max-w-md gaming-card">
        <h1 className="gaming-header text-4xl mb-2 text-center">Create Character</h1>
        <p className="text-gaming-cyan text-center text-sm mb-8">Begin your adventure</p>

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
            <label className="block text-gaming-cyan text-sm font-semibold mb-2">Character Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            {loading ? '⏳ Creating...' : '✨ Create Character'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          Already have account? <Link to="/login" className="text-gaming-cyan hover:text-gaming-gold font-semibold transition-colors">Login here</Link>
        </p>
      </div>
    </div>
  )
}
