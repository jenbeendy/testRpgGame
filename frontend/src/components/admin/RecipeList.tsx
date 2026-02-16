import { useState } from 'react'
import { useAdminStore, type PendingIngredient } from '../../store/adminStore'
import { useAdminRecipes } from '../../hooks/useAdminRecipes'

interface RecipeListProps {
  onSelectRecipe: (id: number) => void
  onCreateNew: () => void
}

export default function RecipeList({ onSelectRecipe, onCreateNew }: RecipeListProps) {
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'skill'>('name')
  const selectedRecipeId = useAdminStore((state) => state.selectedRecipeId)
  const { data: recipes, isLoading } = useAdminRecipes()

  let filtered = recipes || []
  if (searchText) {
    filtered = filtered.filter((r) =>
      r.name.toLowerCase().includes(searchText.toLowerCase())
    )
  }

  if (sortBy === 'skill') {
    filtered = [...filtered].sort((a, b) => a.required_skill_level - b.required_skill_level)
  } else {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg h-screen overflow-y-auto sticky top-0">
      <h2 className="text-xl font-semibold mb-4">Recipes</h2>

      <button
        onClick={onCreateNew}
        className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        + New Recipe
      </button>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
        >
          <option value="name">Name</option>
          <option value="skill">Skill Level</option>
        </select>
      </div>

      <div className="text-xs text-gray-400 mb-4">
        {isLoading ? 'Loading...' : `${filtered.length} recipes`}
      </div>

      <div className="space-y-2">
        {filtered.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => onSelectRecipe(recipe.id)}
            className={`w-full text-left p-3 rounded text-sm transition ${
              selectedRecipeId === recipe.id
                ? 'bg-blue-700 border border-blue-400'
                : 'bg-gray-700 border border-gray-600 hover:border-gray-500'
            }`}
          >
            <p className="font-semibold text-white truncate">{recipe.name}</p>
            <p className="text-xs text-gray-400">Lvl {recipe.required_skill_level}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
