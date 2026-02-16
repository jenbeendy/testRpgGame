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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">RPG Crafting Game</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-sm text-gray-400">Player</p>
            <p className="text-xl font-semibold">{user?.username}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-sm text-gray-400">Skill Level</p>
            <p className="text-3xl font-bold text-green-400">{skills?.crafting_level || 1}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-sm text-gray-400">XP Progress</p>
            <p className="text-lg font-bold text-blue-400">{skills?.crafting_xp || 0} / {skills?.xp_for_next_level || 100}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((skills?.crafting_xp || 0) / (skills?.xp_for_next_level || 100)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">XP Bar</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          {['inventory', 'recipes', 'crafting'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-6 py-3 font-semibold transition ${
                tab === t
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'inventory' && <InventoryDisplay />}
        {tab === 'recipes' && <RecipeBook />}
        {tab === 'crafting' && <CraftingInterface />}
      </div>
    </div>
  )
}
