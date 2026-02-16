import { useState, useEffect } from 'react'
import { useAdminItemStore } from '../../store/adminItemStore'
import {
  useAdminItem,
  useCreateItem,
  useUpdateItem,
  type AdminItem,
} from '../../hooks/useAdminItems'

interface ItemTemplateEditorProps {
  selectedItemId: number | null
  onSuccess: () => void
}

const ITEM_TYPES = ['material', 'weapon', 'armor', 'consumable', 'component']
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const emptyItem: Omit<AdminItem, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  type: 'material',
  rarity: 'common',
  base_durability: 100,
  repair_cost: 0,
  repair_materials: {},
  properties: {},
}

export default function ItemTemplateEditor({
  selectedItemId,
  onSuccess,
}: ItemTemplateEditorProps) {
  const formMode = useAdminItemStore((state) => state.formMode)
  const setFormMode = useAdminItemStore((state) => state.setFormMode)
  const reset = useAdminItemStore((state) => state.reset)
  const pendingProperties = useAdminItemStore((state) => state.pendingProperties)
  const pendingRepairMaterials = useAdminItemStore((state) => state.pendingRepairMaterials)

  const [formData, setFormData] = useState<Omit<AdminItem, 'id' | 'created_at' | 'updated_at'>>(
    emptyItem
  )
  const [error, setError] = useState('')

  const { data: item } = useAdminItem(selectedItemId)
  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem(selectedItemId || 0)

  useEffect(() => {
    if (item) {
      setFormData(item)
      setFormMode('edit')
    } else {
      setFormData(emptyItem)
      setFormMode('create')
    }
  }, [item, setFormMode])

  const validate = () => {
    if (!formData.name.trim()) return 'Item name required'
    if (!formData.type) return 'Type required'
    if (!formData.rarity) return 'Rarity required'
    if (formData.base_durability < 1) return 'Base durability >= 1'
    if (formData.repair_cost < 0) return 'Repair cost >= 0'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      ...formData,
      properties: Object.fromEntries(
        pendingProperties.map((p) => [p.key, p.value])
      ),
      repair_materials: Object.fromEntries(
        pendingRepairMaterials.map((m) => [m.item_id.toString(), m.quantity])
      ),
    }

    try {
      if (formMode === 'create') {
        await createMutation.mutateAsync(payload)
      } else {
        await updateMutation.mutateAsync(payload)
      }
      setError('')
      onSuccess()
      reset()
      setFormData(emptyItem)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed')
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">
        {formMode === 'create' ? 'New Item' : 'Edit Item'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-100 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Item Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
            maxLength={255}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Rarity</label>
            <select
              value={formData.rarity}
              onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            >
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Base Durability</label>
            <input
              type="number"
              min="1"
              value={formData.base_durability}
              onChange={(e) =>
                setFormData({ ...formData, base_durability: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Repair Cost</label>
            <input
              type="number"
              min="0"
              value={formData.repair_cost}
              onChange={(e) =>
                setFormData({ ...formData, repair_cost: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

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
              setFormData(emptyItem)
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
