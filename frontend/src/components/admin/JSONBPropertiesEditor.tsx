import { useState } from 'react'
import { useAdminItemStore, type PendingProperty, type PendingRepairMaterial } from '../../store/adminItemStore'
import { useAdminItems } from '../../hooks/useAdminItems'

interface JSONBPropertiesEditorProps {
  selectedItemId: number | null
}

const typePresets: Record<string, string[]> = {
  weapon: ['damage', 'weight'],
  armor: ['defense', 'weight'],
  consumable: ['healing', 'effect_duration'],
  material: ['rarity', 'source'],
  component: ['quality', 'compatibility'],
}

export default function JSONBPropertiesEditor({ selectedItemId }: JSONBPropertiesEditorProps) {
  const pendingProperties = useAdminItemStore((state) => state.pendingProperties)
  const addProperty = useAdminItemStore((state) => state.addProperty)
  const updateProperty = useAdminItemStore((state) => state.updateProperty)
  const removeProperty = useAdminItemStore((state) => state.removeProperty)

  const pendingRepairMaterials = useAdminItemStore((state) => state.pendingRepairMaterials)
  const addRepairMaterial = useAdminItemStore((state) => state.addRepairMaterial)
  const updateRepairMaterial = useAdminItemStore((state) => state.updateRepairMaterial)
  const removeRepairMaterial = useAdminItemStore((state) => state.removeRepairMaterial)

  const { data: items } = useAdminItems()

  const [propKey, setPropKey] = useState('')
  const [propValue, setPropValue] = useState('')
  const [propType, setPropType] = useState<'string' | 'number' | 'boolean'>('string')

  const [materialItemId, setMaterialItemId] = useState<string>('')
  const [materialQuantity, setMaterialQuantity] = useState(1)

  const handleAddProperty = () => {
    if (!propKey.trim()) return
    const value =
      propType === 'number'
        ? parseFloat(propValue)
        : propType === 'boolean'
          ? propValue === 'true'
          : propValue
    addProperty({ key: propKey, value, type: propType })
    setPropKey('')
    setPropValue('')
    setPropType('string')
  }

  const handleAddRepairMaterial = () => {
    if (!materialItemId) return
    addRepairMaterial({ item_id: parseInt(materialItemId), quantity: materialQuantity })
    setMaterialItemId('')
    setMaterialQuantity(1)
  }

  const handleUpdateProperty = (index: number, field: keyof PendingProperty, val: any) => {
    const updated = { ...pendingProperties[index], [field]: val }
    updateProperty(index, updated)
  }

  const handleUpdateRepairMaterial = (
    index: number,
    field: keyof PendingRepairMaterial,
    val: any
  ) => {
    const updated = { ...pendingRepairMaterials[index], [field]: val }
    updateRepairMaterial(index, updated)
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg h-screen overflow-y-auto space-y-6">
      {/* Properties Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Properties</h2>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Key</label>
            <input
              type="text"
              value={propKey}
              onChange={(e) => setPropKey(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={propType}
                onChange={(e) => setPropType(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Value</label>
              {propType === 'boolean' ? (
                <select
                  value={propValue}
                  onChange={(e) => setPropValue(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
                >
                  <option value="">Select...</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : (
                <input
                  type={propType === 'number' ? 'number' : 'text'}
                  value={propValue}
                  onChange={(e) => setPropValue(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
                />
              )}
            </div>
          </div>

          <button
            onClick={handleAddProperty}
            className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            + Add Property
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {pendingProperties.map((prop, idx) => (
            <div key={idx} className="bg-gray-700 p-3 rounded text-sm">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-white">{prop.key}</p>
                  <p className="text-xs text-gray-400">{prop.type}</p>
                </div>
                <button
                  onClick={() => removeProperty(idx)}
                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
              <input
                type={prop.type === 'number' ? 'number' : 'text'}
                value={prop.value}
                onChange={(e) =>
                  handleUpdateProperty(
                    idx,
                    'value',
                    prop.type === 'number' ? parseFloat(e.target.value) : e.target.value
                  )
                }
                className="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Repair Materials Section */}
      <div className="border-t border-gray-700 pt-4">
        <h2 className="text-lg font-semibold mb-4">Repair Materials</h2>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Item</label>
            <select
              value={materialItemId}
              onChange={(e) => setMaterialItemId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
            >
              <option value="">Select item...</option>
              {items?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (ID: {item.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={materialQuantity}
              onChange={(e) => setMaterialQuantity(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
            />
          </div>

          <button
            onClick={handleAddRepairMaterial}
            className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            + Add Material
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {pendingRepairMaterials.map((material, idx) => {
            const itemName =
              items?.find((i) => i.id === material.item_id)?.name || `Item ${material.item_id}`
            return (
              <div key={idx} className="bg-gray-700 p-3 rounded text-sm">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{itemName}</p>
                    <p className="text-xs text-gray-400">Qty: {material.quantity}</p>
                  </div>
                  <button
                    onClick={() => removeRepairMaterial(idx)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    value={material.quantity}
                    onChange={(e) =>
                      handleUpdateRepairMaterial(
                        idx,
                        'quantity',
                        parseInt(e.target.value)
                      )
                    }
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:outline-none"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
