import { useState } from 'react'
import { useRecipes, usePlayerRecipes, useRecipeHint, type Recipe } from '../hooks/useRecipes'
import { useAuthStore } from '../store/auth'

export default function RecipeBook() {
  const user = useAuthStore((state) => state.user)
  const [filter, setFilter] = useState<'all' | 'discovered' | 'undiscovered'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'skill' | 'success'>('name')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showHint, setShowHint] = useState(false)

  const { data: allRecipes, isLoading } = useRecipes()
  const { data: discoveredRecipes } = usePlayerRecipes(user?.id || 0)
  const { data: hint } = useRecipeHint(selectedRecipe?.id || 0)

  const discoveredIds = new Set(discoveredRecipes?.map((r) => r.id) || [])

  let filteredRecipes = allRecipes || []
  if (filter === 'discovered') {
    filteredRecipes = filteredRecipes.filter((r) => discoveredIds.has(r.id))
  } else if (filter === 'undiscovered') {
    filteredRecipes = filteredRecipes.filter((r) => !discoveredIds.has(r.id))
  }

  if (sortBy === 'skill') {
    filteredRecipes = [...filteredRecipes].sort((a, b) => a.required_skill_level - b.required_skill_level)
  } else if (sortBy === 'success') {
    filteredRecipes = [...filteredRecipes].sort((a, b) => b.success_rate - a.success_rate)
  } else {
    filteredRecipes = [...filteredRecipes].sort((a, b) => a.name.localeCompare(b.name))
  }

  const getRecipeStatus = (recipe: Recipe) => {
    if (discoveredIds.has(recipe.id)) return 'Discovered'
    return 'Unknown'
  }

  const getSkillColor = (required: number, current: number) => {
    if (current >= required) return 'text-gaming-green'
    if (current >= required - 2) return 'text-gaming-gold'
    return 'text-red-400'
  }

  if (isLoading) {
    return <div className="text-gaming-cyan text-center py-12">⏳ Loading recipes...</div>
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Sidebar */}
      <div className="col-span-1 gaming-card h-fit sticky top-0">
        <h3 className="text-xl font-bold text-gaming-cyan mb-6">🎚️ Filters</h3>

        <div className="mb-6">
          <label className="block text-gaming-cyan text-sm font-bold uppercase mb-2">Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="gaming-input text-sm"
          >
            <option value="all">📚 All Recipes</option>
            <option value="discovered">✨ Discovered</option>
            <option value="undiscovered">🔒 Unknown</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gaming-cyan text-sm font-bold uppercase mb-2">Sort</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="gaming-input text-sm"
          >
            <option value="name">📝 Name</option>
            <option value="skill">⚔️ Skill Level</option>
            <option value="success">💯 Success</option>
          </select>
        </div>

        <div className="grid gap-3">
          <div className="gaming-stat">
            <p className="text-gaming-cyan text-xs font-bold uppercase">Found</p>
            <p className="text-2xl font-bold text-gaming-gold mt-2">{filteredRecipes.length}</p>
          </div>
          <div className="gaming-stat">
            <p className="text-gaming-cyan text-xs font-bold uppercase">Discovered</p>
            <p className="text-2xl font-bold text-gaming-green mt-2">{discoveredIds.size}</p>
          </div>
        </div>
      </div>

      {/* Recipe List */}
      <div className="col-span-2">
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => {
                setSelectedRecipe(recipe)
                setShowHint(false)
              }}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                selectedRecipe?.id === recipe.id
                  ? 'gaming-card border-gaming-cyan shadow-glow-cyan'
                  : 'gaming-card-sm hover:border-gaming-cyan/60 hover:shadow-glow'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-white">{recipe.name}</h4>
                  <p className={`text-xs font-semibold mt-1 ${discoveredIds.has(recipe.id) ? 'text-gaming-green' : 'text-gaming-gold'}`}>
                    {discoveredIds.has(recipe.id) ? '✨ Discovered' : '🔒 Unknown'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold block mb-1 ${getSkillColor(recipe.required_skill_level, user?.crafting_level || 1)}`}>
                    Lvl {recipe.required_skill_level}
                  </span>
                  <p className="text-xs text-gaming-gold font-semibold">{recipe.success_rate}%</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Recipe Details */}
        {selectedRecipe && (
          <div className="gaming-card">
            <h2 className="gaming-header text-3xl mb-3">{selectedRecipe.name}</h2>
            <p className="text-gray-300 mb-6">{selectedRecipe.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="gaming-stat">
                <p className="text-gaming-cyan text-xs font-bold uppercase">Required Level</p>
                <p className={`text-2xl font-bold mt-2 ${getSkillColor(selectedRecipe.required_skill_level, user?.crafting_level || 1)}`}>
                  {selectedRecipe.required_skill_level}
                </p>
              </div>
              <div className="gaming-stat">
                <p className="text-gaming-cyan text-xs font-bold uppercase">Success Rate</p>
                <p className="text-2xl font-bold text-gaming-green mt-2">{selectedRecipe.success_rate}%</p>
              </div>
              <div className="gaming-stat">
                <p className="text-gaming-cyan text-xs font-bold uppercase">Time</p>
                <p className="text-2xl font-bold text-gaming-cyan mt-2">{selectedRecipe.crafting_time_ms / 1000}s</p>
              </div>
              <div className="gaming-stat">
                <p className="text-gaming-cyan text-xs font-bold uppercase">Ingredients</p>
                <p className="text-2xl font-bold text-gaming-gold mt-2">{selectedRecipe.ingredients.length}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gaming-cyan mb-3">📋 Ingredients</h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-gray-200 text-sm bg-gaming-darker p-2 rounded border border-gaming-purple/20">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gaming-purple/30 rounded-full mr-3 text-xs font-bold text-gaming-cyan">
                      {ing.position + 1}
                    </span>
                    <span className="font-semibold">x{ing.quantity}</span>
                    <span className="text-gray-400"> Item #{ing.item_id}</span>
                    {ing.optional && <span className="ml-2 text-gaming-gold text-xs font-bold">(optional)</span>}
                  </li>
                ))}
              </ul>
            </div>

            {!discoveredIds.has(selectedRecipe.id) && (
              <div className="bg-gaming-gold/10 border border-gaming-gold/50 p-4 rounded-lg mb-4">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-gaming-gold hover:text-gaming-gold/80 underline font-bold"
                >
                  {showHint ? '👁️ Hide Hint' : '💡 Show Hint'}
                </button>
                {showHint && hint && (
                  <p className="mt-3 text-gaming-gold text-sm bg-gaming-darker p-3 rounded border border-gaming-gold/30">
                    🔍 {hint}
                  </p>
                )}
              </div>
            )}

            <button className="gaming-button w-full">
              ⚔️ Craft This Recipe
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
