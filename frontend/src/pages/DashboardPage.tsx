import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'
import InventoryDisplay from '../components/InventoryDisplay'
import RecipeBook from '../components/RecipeBook'
import CraftingInterface from '../components/CraftingInterface'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [tab, setTab] = useState<'inventory' | 'recipes' | 'crafting'>('inventory')

  const { data: skills } = useQuery({
    queryKey: ['skills', user?.id],
    queryFn: async () => {
      const res = await axios.get(`/api/skills/${user?.id}`)
      return res.data
    },
    enabled: !!user,
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gaming-dark text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="gaming-header text-5xl">⚔️ Crafting Realm</h1>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-glow hover:scale-105 transition-all duration-200"
          >
            🚪 Logout
          </button>
        </div>

        {/* Character Stats */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="gaming-stat">
            <p className="text-gaming-cyan text-xs font-bold uppercase tracking-wider">Character</p>
            <p className="text-2xl font-bold text-white mt-2">{user?.username}</p>
            <p className="text-xs text-gray-400 mt-1">Lvl {skills?.crafting_level || 1}</p>
          </div>
          <div className="gaming-stat">
            <p className="text-gaming-gold text-xs font-bold uppercase tracking-wider">Skill</p>
            <p className="text-4xl font-bold text-gaming-gold mt-2">{skills?.crafting_level || 1}</p>
          </div>
          <div className="gaming-stat">
            <p className="text-gaming-cyan text-xs font-bold uppercase tracking-wider">Experience</p>
            <p className="text-lg font-bold text-gaming-cyan mt-2">{skills?.crafting_xp || 0}</p>
            <p className="text-xs text-gray-400 mt-1">/ {skills?.xp_for_next_level || 100}</p>
          </div>
          <div className="gaming-stat">
            <p className="text-gaming-purple text-xs font-bold uppercase tracking-wider">Progress</p>
            <div className="w-full bg-gaming-darker rounded-full h-3 mt-3 overflow-hidden border border-gaming-purple/30">
              <div
                className="bg-gradient-to-r from-gaming-purple to-gaming-cyan h-full rounded-full transition-all duration-500 shadow-glow"
                style={{ width: `${Math.min(100, ((skills?.crafting_xp || 0) / (skills?.xp_for_next_level || 100)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Level up progress</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-gaming-purple/20 pb-4">
          {['inventory', 'recipes', 'crafting'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-2 py-2 font-bold text-lg transition-all duration-200 ${
                tab === t
                  ? 'gaming-tab-active border-b-2'
                  : 'gaming-tab-inactive hover:text-gaming-purple'
              }`}
            >
              {t === 'inventory' && '🎒'} {t === 'recipes' && '📖'} {t === 'crafting' && '🔨'}{' '}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {tab === 'inventory' && <InventoryDisplay />}
          {tab === 'recipes' && <RecipeBook />}
          {tab === 'crafting' && <CraftingInterface />}
        </div>
      </div>
    </div>
  )
}
