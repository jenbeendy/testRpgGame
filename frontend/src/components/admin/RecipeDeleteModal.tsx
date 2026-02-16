import { useDeleteRecipe } from '../../hooks/useAdminRecipes'

interface RecipeDeleteModalProps {
  recipeId: number
  recipeName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function RecipeDeleteModal({
  recipeId,
  recipeName,
  isOpen,
  onClose,
  onConfirm,
}: RecipeDeleteModalProps) {
  const deleteMutation = useDeleteRecipe()

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(recipeId)
      onConfirm()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Delete Recipe</h2>
        <p className="text-gray-300 mb-6">
          Delete "<span className="font-semibold">{recipeName}</span>"? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
