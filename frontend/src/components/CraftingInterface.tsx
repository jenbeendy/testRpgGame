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
    <div className="grid grid-cols-2 gap-8">
      {/* Recipe Selector */}
      <div className="gaming-card">
        <h3 className="text-2xl font-bold mb-6 text-gaming-cyan">📚 Available Recipes</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gaming-purple scrollbar-track-gaming-darker">
          {recipes?.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              disabled={isCrafting || user!.crafting_level < recipe.required_skill_level}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 border ${
                selectedRecipe?.id === recipe.id
                  ? 'bg-gaming-purple/20 border-gaming-purple/80 shadow-glow'
                  : 'bg-gaming-darker border-gaming-purple/20 hover:border-gaming-cyan/50 hover:bg-gaming-darker/80'
              } ${user!.crafting_level < recipe.required_skill_level ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-glow-cyan'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">{recipe.name}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${user!.crafting_level >= recipe.required_skill_level ? 'bg-gaming-green/30 text-gaming-green' : 'bg-red-500/30 text-red-300'}`}>
                  Lvl {recipe.required_skill_level}
                </span>
              </div>
              {user!.crafting_level < recipe.required_skill_level && (
                <p className="text-xs text-red-300 mt-2">🔒 Locked - Need Lvl {recipe.required_skill_level}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Crafting Interface */}
      <div className="gaming-card">
        {selectedRecipe ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gaming-gold mb-2">{selectedRecipe.name}</h3>
              <p className="text-gray-300">{selectedRecipe.description}</p>
            </div>

            {/* Recipe Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="gaming-stat">
                <p className="text-gaming-cyan text-xs font-bold uppercase">Required Level</p>
                <p className="text-2xl font-bold text-gaming-gold mt-2">{selectedRecipe.required_skill_level}</p>
              </div>
              <div className="gaming-stat">
                <p className="text-gaming-green text-xs font-bold uppercase">Success Rate</p>
                <p className="text-2xl font-bold text-gaming-green mt-2">{selectedRecipe.success_rate}%</p>
              </div>
              <div className="gaming-stat">
                <p className="text-gaming-cyan text-xs font-bold uppercase">Craft Time</p>
                <p className="text-2xl font-bold mt-2">{selectedRecipe.crafting_time_ms / 1000}s</p>
              </div>
              <div className="gaming-stat">
                <p className="text-gaming-purple text-xs font-bold uppercase">Your Level</p>
                <p className={`text-2xl font-bold mt-2 ${user!.crafting_level >= selectedRecipe.required_skill_level ? 'text-gaming-green' : 'text-red-400'}`}>
                  {user?.crafting_level}
                </p>
              </div>
            </div>

            {/* Crafting Progress */}
            {isCrafting && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gaming-purple font-bold">⚒️ Crafting...</span>
                  <span className="text-gaming-gold font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gaming-darker rounded-full h-4 overflow-hidden border border-gaming-purple/30">
                  <div
                    className="h-full bg-gradient-to-r from-gaming-purple to-gaming-cyan transition-all duration-300 shadow-glow"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`p-4 rounded-lg border ${result.success ? 'bg-gaming-green/20 border-gaming-green/50' : 'bg-red-900/20 border-red-500/50'}`}>
                <p className={`font-bold text-lg ${result.success ? 'text-gaming-green' : 'text-red-300'}`}>
                  {result.success ? '✨ Crafted!' : '❌ Failed!'}
                </p>
                <p className={`text-sm mt-1 ${result.success ? 'text-gaming-green' : 'text-red-200'}`}>{result.message}</p>
                {result.xp > 0 && <p className="text-gaming-gold text-sm font-bold mt-2">+{result.xp} Experience</p>}
              </div>
            )}

            {/* Craft Button */}
            <button
              onClick={() => handleCraft(selectedRecipe)}
              disabled={!canCraft || isCrafting}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                canCraft && !isCrafting
                  ? 'gaming-button hover:shadow-glow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isCrafting ? '⏳ Crafting...' : canCraft ? '⚔️ Start Crafting' : '🔒 Skill Level Too Low'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <p className="text-4xl mb-4">📖</p>
            <p className="text-xl text-gaming-cyan font-semibold">Select a recipe</p>
            <p className="text-gray-400 mt-2">Choose a recipe from the list to begin crafting</p>
          </div>
        )}
      </div>
    </div>
  )
}
