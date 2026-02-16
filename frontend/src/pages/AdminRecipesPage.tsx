import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAdminStore } from '../store/adminStore'
import RecipeList from '../components/admin/RecipeList'
import RecipeEditor from '../components/admin/RecipeEditor'
import IngredientEditor from '../components/admin/IngredientEditor'
import RecipeDeleteModal from '../components/admin/RecipeDeleteModal'
import { useAdminRecipe } from '../hooks/useAdminRecipes'

export default function AdminRecipesPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const selectedRecipeId = useAdminStore((state) => state.selectedRecipeId)
  const selectRecipe = useAdminStore((state) => state.selectRecipe)
  const reset = useAdminStore((state) => state.reset)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { data: recipe } = useAdminRecipe(selectedRecipeId)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCreateNew = () => {
    selectRecipe(null)
    reset()
  }

  const handleSelectRecipe = (id: number) => {
    selectRecipe(id)
  }

  const handleSuccess = () => {
    handleCreateNew()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin - Recipe Editor</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Sidebar - Recipe List */}
          <div className="col-span-1">
            <RecipeList onSelectRecipe={handleSelectRecipe} onCreateNew={handleCreateNew} />
          </div>

          {/* Center - Recipe Editor Form */}
          <div className="col-span-1">
            <RecipeEditor selectedRecipeId={selectedRecipeId} onSuccess={handleSuccess} />

            {selectedRecipeId && recipe && (
              <div className="mt-6">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Recipe
                </button>
              </div>
            )}
          </div>

          {/* Right - Ingredient Editor */}
          <div className="col-span-1">
            <IngredientEditor selectedRecipeId={selectedRecipeId} />
          </div>
        </div>

        {selectedRecipeId && recipe && (
          <RecipeDeleteModal
            recipeId={selectedRecipeId}
            recipeName={recipe.name}
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => {
              setShowDeleteModal(false)
              handleCreateNew()
            }}
          />
        )}
      </div>
    </div>
  )
}
