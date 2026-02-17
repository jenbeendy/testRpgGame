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

const ITEM_NAMES: Record<number, string> = {
  1: 'Copper Ore', 2: 'Iron Ore', 3: 'Gold Ore',
  5: 'Wood Log', 7: 'Leather Scrap', 8: 'Fine Leather', 9: 'Coal',
  11: 'Water Essence', 12: 'Fire Essence', 13: 'Earth Essence', 14: 'Air Essence', 15: 'Crystal Shard',
  16: 'Pure Crystal', 17: 'String', 18: 'Rope', 19: 'Cloth',
  20: 'Leather Armor', 21: 'Copper Ingot', 22: 'Iron Ingot', 23: 'Steel Ingot',
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
    return <div className="text-gaming-cyan text-center py-12">⏳ Loading inventory...</div>
  }

  const itemsBySlot: Record<string, InventoryItem> = {}

  inventory?.forEach((item) => {
    if (item.slot_x !== null && item.slot_y !== null) {
      itemsBySlot[`${item.slot_x},${item.slot_y}`] = item
    }
  })

  return (
    <div className="gaming-card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gaming-cyan">🎒 Inventory</h3>
        <span className="text-sm text-gaming-gold bg-gaming-purple/20 px-3 py-1 rounded-full">{inventory?.length || 0} items</span>
      </div>

      <div className="grid grid-cols-10 gap-3 mb-6">
        {Array.from({ length: 30 }).map((_, idx) => {
          const x = idx % 10
          const y = Math.floor(idx / 10)
          const item = itemsBySlot[`${x},${y}`]

          return (
            <div
              key={`${x},${y}`}
              className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                item
                  ? 'border-gaming-cyan/80 bg-gaming-purple/30 hover:bg-gaming-purple/50 shadow-glow-cyan hover:scale-105'
                  : 'border-gaming-purple/20 bg-gaming-darker hover:border-gaming-cyan/50 hover:bg-gaming-darker/80'
              }`}
              title={item ? `${ITEM_NAMES[item.item_template_id] || `Item #${item.item_template_id}`} x${item.quantity}` : 'Empty slot'}
            >
              {item ? (
                <div className="text-center text-xs px-1">
                  <div className="text-xs font-semibold text-gaming-cyan truncate">{ITEM_NAMES[item.item_template_id] || `#${item.item_template_id}`}</div>
                  <div className="text-xs font-bold text-gaming-gold mt-1">{item.quantity}</div>
                  {item.current_durability < 100 && (
                    <div className="text-xs text-gaming-gold mt-1" title="Durability">
                      {item.current_durability}%
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-600 font-bold">—</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="gaming-stat">
          <p className="text-gaming-cyan text-xs font-bold uppercase">Total Items</p>
          <p className="text-2xl font-bold text-gaming-gold mt-2">{inventory?.length || 0}</p>
        </div>
        <div className="gaming-stat">
          <p className="text-gaming-cyan text-xs font-bold uppercase">Slots Used</p>
          <p className="text-2xl font-bold text-gaming-cyan mt-2">{inventory?.length || 0}/30</p>
        </div>
        <div className="gaming-stat">
          <p className="text-gaming-cyan text-xs font-bold uppercase">Capacity</p>
          <p className="text-2xl font-bold text-gaming-purple mt-2">{Math.round(((inventory?.length || 0) / 30) * 100)}%</p>
        </div>
      </div>
    </div>
  )
}
