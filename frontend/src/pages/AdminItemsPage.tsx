import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAdminItemStore } from '../store/adminItemStore'
import ItemList from '../components/admin/ItemList'
import ItemTemplateEditor from '../components/admin/ItemTemplateEditor'
import JSONBPropertiesEditor from '../components/admin/JSONBPropertiesEditor'
import ItemDeleteModal from '../components/admin/ItemDeleteModal'
import { useAdminItem } from '../hooks/useAdminItems'

export default function AdminItemsPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const selectedItemId = useAdminItemStore((state) => state.selectedItemId)
  const selectItem = useAdminItemStore((state) => state.selectItem)
  const reset = useAdminItemStore((state) => state.reset)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { data: item } = useAdminItem(selectedItemId)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCreateNew = () => {
    selectItem(null)
    reset()
  }

  const handleSelectItem = (id: number) => {
    selectItem(id)
  }

  const handleSuccess = () => {
    handleCreateNew()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin - Item Template Editor</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Left Sidebar - Item List */}
          <div className="col-span-1">
            <ItemList onSelectItem={handleSelectItem} onCreateNew={handleCreateNew} />
          </div>

          {/* Center - Item Editor Form */}
          <div className="col-span-2">
            <ItemTemplateEditor selectedItemId={selectedItemId} onSuccess={handleSuccess} />

            {selectedItemId && item && (
              <div className="mt-6">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Item
                </button>
              </div>
            )}
          </div>

          {/* Right - Properties & Materials Editor */}
          <div className="col-span-2">
            <JSONBPropertiesEditor selectedItemId={selectedItemId} />
          </div>
        </div>

        {selectedItemId && item && (
          <ItemDeleteModal
            itemId={selectedItemId}
            itemName={item.name}
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
