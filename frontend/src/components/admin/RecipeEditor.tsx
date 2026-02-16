import { useState, useEffect } from 'react'
import { useAdminStore } from '../../store/adminStore'
import { useAdminRecipe, useItemTemplates, useCreateRecipe, useUpdateRecipe } from '../../hooks/useAdminRecipes'
import type { AdminRecipe } from '../../hooks/useAdminRecipes'

interface RecipeEditorProps {
  selectedRecipeId: number | null
  onSuccess: () => void
}

const emptyRecipe: Omit<AdminRecipe, 'id'> = {
  name: '',
  description: '',
  result_item_id: 1,
  success_rate: 50,
  required_skill_level: 1,
  crafting_time_ms: 5000,
  discoverable: false,
  hints: '',
}

export default function RecipeEditor({ selectedRecipeId, onSuccess }: RecipeEditorProps) {
  const formMode = useAdminStore((state) => state.formMode)
  const setFormMode = useAdminStore((state) => state.setFormMode)
  const reset = useAdminStore((state) => state.reset)

  const [formData, setFormData] = useState<Omit<AdminRecipe, 'id'>>(emptyRecipe)
  const [error, setError] = useState('')

  const { data: recipe } = useAdminRecipe(selectedRecipeId)
  const { data: items } = useItemTemplates()
  const createMutation = useCreateRecipe()
  const updateMutation = useUpdateRecipe(selectedRecipeId || 0)

  useEffect(() => {
    if (recipe) {
      setFormData(recipe)
      setFormMode('edit')
    } else {
      setFormData(emptyRecipe)
      setFormMode('create')
    }
  }, [recipe, setFormMode])

  const validate = () => {
    if (!formData.name.trim()) return 'Recipe name required'
    if (formData.success_rate < 0 || formData.success_rate > 100) return 'Success rate 0-100'
    if (formData.required_skill_level < 1) return 'Skill level >= 1'
    if (formData.crafting_time_ms < 0) return 'Crafting time >= 0'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      if (formMode === 'create') {
        await createMutation.mutateAsync(formData)
      } else {
        await updateMutation.mutateAsync(formData)
      }
      setError('')
      onSuccess()
      reset()
      setFormData(emptyRecipe)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed')
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">
        {formMode === 'create' ? 'New Recipe' : 'Edit Recipe'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-100 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Recipe Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Result Item</label>
          <select
            value={formData.result_item_id}
            onChange={(e) => setFormData({ ...formData, result_item_id: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          >
            {items?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} (ID: {item.id})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Success Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.success_rate}
              onChange={(e) => setFormData({ ...formData, success_rate: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Skill Level</label>
            <input
              type="number"
              min="1"
              value={formData.required_skill_level}
              onChange={(e) => setFormData({ ...formData, required_skill_level: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Crafting Time (ms)</label>
          <input
            type="number"
            min="0"
            value={formData.crafting_time_ms}
            onChange={(e) => setFormData({ ...formData, crafting_time_ms: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="discoverable"
            checked={formData.discoverable}
            onChange={(e) => setFormData({ ...formData, discoverable: e.target.checked })}
            disabled={isLoading}
            className="w-4 h-4"
          />
          <label htmlFor="discoverable" className="text-sm text-gray-400">
            Discoverable
          </label>
        </div>

        {formData.discoverable && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hints</label>
            <textarea
              value={formData.hints}
              onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              rows={2}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : formMode === 'create' ? 'Create' : 'Update'}
          </button>
          <button
            type="button"
            onClick={() => {
              reset()
              setFormData(emptyRecipe)
              setError('')
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}
