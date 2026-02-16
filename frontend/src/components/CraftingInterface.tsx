import { useState } from 'react'
import { useRecipes, type Recipe } from '../hooks/useRecipes'
import { useAuthStore } from '../store/auth'

export default function CraftingInterface() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isCrafting, setIsCrafting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ success: boolean; message: string; xp: number } | null>(null)

  const { data: recipes, isLoading } = useRecipes()
  const user = useAuthStore((state) => state.user)

  const handleCraft = async (recipe: Recipe) => {
    if (!user) return

    setIsCrafting(true)
    setProgress(0)
    setResult(null)

    // Simulate crafting progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + (Math.random() * 30)
      })
    }, 200)

    try {
      // Call craft API
      const res = await fetch(`/api/craft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_id: recipe.id, ingredients: {} }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ success: false, message: 'Crafting failed', xp: 0 })
    } finally {
      setProgress(100)
      setIsCrafting(false)
    }
  }

  const canCraft = selectedRecipe && user && user.crafting_level >= selectedRecipe.required_skill_level

  if (isLoading) {
    return <div className="text-gray-400">Loading recipes...</div>
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Recipe Selector */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Available Recipes</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recipes?.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              disabled={isCrafting || user!.crafting_level < recipe.required_skill_level}
              className={`w-full text-left p-3 rounded transition ${
                selectedRecipe?.id === recipe.id
                  ? 'bg-blue-700 border border-blue-400'
                  : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
              } ${user!.crafting_level < recipe.required_skill_level ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex justify-between">
                <span className="font-medium">{recipe.name}</span>
                <span className="text-sm text-gray-400">Lvl {recipe.required_skill_level}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Crafting Interface */}
      <div className="bg-gray-800 p-6 rounded-lg">
        {selectedRecipe ? (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{selectedRecipe.name}</h3>

            <div className="bg-gray-700 p-4 rounded">
              <p className="text-sm text-gray-400 mb-2">Description</p>
              <p className="text-white">{selectedRecipe.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-xs text-gray-400">Skill Required</p>
                <p className="text-lg font-bold text-blue-400">{selectedRecipe.required_skill_level}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-xs text-gray-400">Success Rate</p>
                <p className="text-lg font-bold text-green-400">{selectedRecipe.success_rate}%</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-lg font-bold">{selectedRecipe.crafting_time_ms / 1000}s</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-xs text-gray-400">Your Skill</p>
                <p className={`text-lg font-bold ${user!.crafting_level >= selectedRecipe.required_skill_level ? 'text-green-400' : 'text-red-400'}`}>
                  {user?.crafting_level}
                </p>
              </div>
            </div>

            {isCrafting && (
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Crafting...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {result && (
              <div className={`p-4 rounded ${result.success ? 'bg-green-900 border border-green-600' : 'bg-red-900 border border-red-600'}`}>
                <p className={result.success ? 'text-green-100' : 'text-red-100'}>{result.message}</p>
                {result.xp > 0 && <p className="text-green-200 text-sm mt-1">+{result.xp} XP</p>}
              </div>
            )}

            <button
              onClick={() => handleCraft(selectedRecipe)}
              disabled={!canCraft || isCrafting}
              className={`w-full px-4 py-3 rounded font-semibold transition ${
                canCraft && !isCrafting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isCrafting ? 'Crafting...' : canCraft ? 'Start Crafting' : 'Skill Level Too Low'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a recipe to begin crafting
          </div>
        )}
      </div>
    </div>
  )
}
