import { useState } from 'react'
import { useAdminItemStore } from '../store/adminItemStore'
import AdminLayout from '../components/AdminLayout'
import ItemList from '../components/admin/ItemList'
import ItemTemplateEditor from '../components/admin/ItemTemplateEditor'
import JSONBPropertiesEditor from '../components/admin/JSONBPropertiesEditor'
import ItemDeleteModal from '../components/admin/ItemDeleteModal'
import { useAdminItem } from '../hooks/useAdminItems'

export default function AdminItemsPage() {
  const selectedItemId = useAdminItemStore((state) => state.selectedItemId)
  const selectItem = useAdminItemStore((state) => state.selectItem)
  const reset = useAdminItemStore((state) => state.reset)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { data: item } = useAdminItem(selectedItemId)

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
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Item Template Editor</h1>

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
    </AdminLayout>
  )
}
