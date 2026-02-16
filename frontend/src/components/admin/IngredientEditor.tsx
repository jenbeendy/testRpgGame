import { useState } from 'react'
import { useAdminStore, type PendingIngredient } from '../../store/adminStore'
import { useItemTemplates } from '../../hooks/useAdminRecipes'

interface IngredientEditorProps {
  selectedRecipeId: number | null
}

export default function IngredientEditor({ selectedRecipeId }: IngredientEditorProps) {
  const pendingIngredients = useAdminStore((state) => state.pendingIngredients)
  const addPendingIngredient = useAdminStore((state) => state.addPendingIngredient)
  const updatePendingIngredient = useAdminStore((state) => state.updatePendingIngredient)
  const removePendingIngredient = useAdminStore((state) => state.removePendingIngredient)
  const reorderIngredients = useAdminStore((state) => state.reorderIngredients)

  const [formData, setFormData] = useState<Omit<PendingIngredient, 'id'>>({
    item_id: 1,
    quantity: 1,
    position: 0,
  })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [error, setError] = useState('')

  const { data: items } = useItemTemplates()

  const validate = () => {
    if (editingIndex === null) {
      const duplicate = pendingIngredients.some((ing) => ing.position === formData.position)
      if (duplicate) return `Position ${formData.position} already used`
    }
    if (formData.quantity < 1) return 'Quantity >= 1'
    return ''
  }

  const handleAdd = () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    if (editingIndex !== null) {
      updatePendingIngredient(editingIndex, formData)
      setEditingIndex(null)
    } else {
      addPendingIngredient(formData)
    }

    setFormData({ item_id: 1, quantity: 1, position: (pendingIngredients.length || 0) })
    setError('')
  }

  const handleEdit = (index: number) => {
    setFormData(pendingIngredients[index])
    setEditingIndex(index)
  }

  const handleCancel = () => {
    setFormData({ item_id: 1, quantity: 1, position: 0 })
    setEditingIndex(null)
    setError('')
  }

  const maxPosition = Math.max(...pendingIngredients.map((ing) => ing.position), -1)

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Ingredients ({pendingIngredients.length}/5)</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-100 rounded text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-700 p-4 rounded mb-4 space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Item</label>
          <select
            value={formData.item_id}
            onChange={(e) => setFormData({ ...formData, item_id: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
          >
            {items?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Position (0-4)</label>
            <input
              type="number"
              min="0"
              max="4"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={pendingIngredients.length >= 5 && editingIndex === null}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {editingIndex !== null ? 'Update' : 'Add'}
          </button>
          {editingIndex !== null && (
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {pendingIngredients.map((ingredient, index) => {
          const item = items?.find((i) => i.id === ingredient.item_id)
          return (
            <div key={index} className="bg-gray-700 p-3 rounded flex justify-between items-center">
              <div className="flex-1">
                <div className="flex gap-2">
                  <span className="inline-block w-6 h-6 bg-gray-600 rounded-full text-center text-xs leading-6 text-white">
                    {ingredient.position}
                  </span>
                  <span className="text-white">
                    x{ingredient.quantity} {item?.name || `Item #${ingredient.item_id}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                {index > 0 && (
                  <button
                    onClick={() => reorderIngredients(index, index - 1)}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                  >
                    ↑
                  </button>
                )}
                {index < pendingIngredients.length - 1 && (
                  <button
                    onClick={() => reorderIngredients(index, index + 1)}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                  >
                    ↓
                  </button>
                )}
                <button
                  onClick={() => handleEdit(index)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => removePendingIngredient(index)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {pendingIngredients.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-6">
          No ingredients added yet
        </div>
      )}
    </div>
  )
}
