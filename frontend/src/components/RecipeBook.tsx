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
    if (current >= required) return 'text-green-400'
    if (current >= required - 2) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (isLoading) {
    return <div className="text-gray-400">Loading recipes...</div>
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Sidebar */}
      <div className="col-span-1 bg-gray-800 p-6 rounded-lg h-fit sticky top-0">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Recipe Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
          >
            <option value="all">All Recipes</option>
            <option value="discovered">Discovered</option>
            <option value="undiscovered">Unknown</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
          >
            <option value="name">Name</option>
            <option value="skill">Skill Level</option>
            <option value="success">Success Rate</option>
          </select>
        </div>

        <div className="text-sm text-gray-400">
          <p className="mb-2">Found: {filteredRecipes.length} recipes</p>
          <p className="mb-2">Discovered: {discoveredIds.size}</p>
        </div>
      </div>

      {/* Recipe List */}
      <div className="col-span-2">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => {
                setSelectedRecipe(recipe)
                setShowHint(false)
              }}
              className={`w-full text-left p-4 rounded transition ${
                selectedRecipe?.id === recipe.id
                  ? 'bg-blue-700 border-2 border-blue-400'
                  : 'bg-gray-800 border border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-white">{recipe.name}</h4>
                  <p className="text-sm text-gray-400">{getRecipeStatus(recipe)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${getSkillColor(recipe.required_skill_level, user?.crafting_level || 1)}`}>
                    Lvl {recipe.required_skill_level}
                  </span>
                  <p className="text-xs text-gray-500">{recipe.success_rate}% success</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Recipe Details */}
        {selectedRecipe && (
          <div className="mt-6 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">{selectedRecipe.name}</h2>
            <p className="text-gray-300 mb-4">{selectedRecipe.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-gray-400 text-sm">Skill Required</p>
                <p className={`text-xl font-bold ${getSkillColor(selectedRecipe.required_skill_level, user?.crafting_level || 1)}`}>
                  Level {selectedRecipe.required_skill_level}
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-xl font-bold text-green-400">{selectedRecipe.success_rate}%</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-gray-400 text-sm">Crafting Time</p>
                <p className="text-xl font-bold text-blue-400">{selectedRecipe.crafting_time_ms / 1000}s</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-gray-400 text-sm">Ingredients</p>
                <p className="text-xl font-bold">{selectedRecipe.ingredients.length}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Ingredients</h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-gray-300 text-sm">
                    <span className="inline-block w-6 h-6 bg-gray-700 rounded-full mr-2 text-center leading-6">
                      {ing.position + 1}
                    </span>
                    x{ing.quantity} Item #{ing.item_id}
                    {ing.optional && <span className="ml-2 text-yellow-400 text-xs">(optional)</span>}
                  </li>
                ))}
              </ul>
            </div>

            {!discoveredIds.has(selectedRecipe.id) && (
              <div className="bg-yellow-900 border border-yellow-600 p-4 rounded">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
                {showHint && hint && (
                  <p className="mt-2 text-yellow-100">💡 {hint}</p>
                )}
              </div>
            )}

            <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Craft This Recipe
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
