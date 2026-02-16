import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '../store/auth'

interface InventoryItem {
  id: number
  item_template_id: number
  quantity: number
  slot_x: number
  slot_y: number
  current_durability: number
}

export default function InventoryDisplay() {
  const user = useAuthStore((state) => state.user)

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      const res = await axios.get(`/api/inventory/${user?.id}`)
      return res.data.items as InventoryItem[]
    },
    enabled: !!user,
  })

  if (isLoading) {
    return <div className="text-gray-400">Loading inventory...</div>
  }

  const slots = Array(30).fill(null)
  const itemsBySlot: Record<string, InventoryItem> = {}

  inventory?.forEach((item) => {
    if (item.slot_x !== null && item.slot_y !== null) {
      itemsBySlot[`${item.slot_x},${item.slot_y}`] = item
    }
  })

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Inventory (0/{30 * 2})</h3>

      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 30 }).map((_, idx) => {
          const x = idx % 10
          const y = Math.floor(idx / 10)
          const item = itemsBySlot[`${x},${y}`]

          return (
            <div
              key={`${x},${y}`}
              className={`aspect-square rounded border-2 flex items-center justify-center cursor-pointer transition ${
                item
                  ? 'border-blue-500 bg-blue-900 hover:bg-blue-800'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              }`}
              title={item ? `Item #${item.item_template_id} x${item.quantity}` : 'Empty'}
            >
              {item && (
                <div className="text-center">
                  <div className="text-xs font-bold text-white">{item.quantity}</div>
                  {item.current_durability < 100 && (
                    <div
                      className="text-xs text-yellow-300 mt-1"
                      title="Durability"
                    >
                      {item.current_durability}%
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>Total items: {inventory?.length || 0}</p>
      </div>
    </div>
  )
}
