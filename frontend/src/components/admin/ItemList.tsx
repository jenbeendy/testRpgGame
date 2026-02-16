import { useState } from 'react'
import { useAdminItemStore } from '../../store/adminItemStore'
import { useAdminItems } from '../../hooks/useAdminItems'

interface ItemListProps {
  onSelectItem: (id: number) => void
  onCreateNew: () => void
}

const ITEM_TYPES = ['', 'material', 'weapon', 'armor', 'consumable', 'component']
const RARITIES = ['', 'common', 'uncommon', 'rare', 'epic', 'legendary']

const rarityColors: Record<string, string> = {
  common: 'bg-gray-600',
  uncommon: 'bg-green-600',
  rare: 'bg-blue-600',
  epic: 'bg-purple-600',
  legendary: 'bg-orange-600',
}

export default function ItemList({ onSelectItem, onCreateNew }: ItemListProps) {
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'rarity'>('name')

  const selectedItemId = useAdminItemStore((state) => state.selectedItemId)
  const { data: items, isLoading } = useAdminItems()

  let filtered = items || []

  if (searchText) {
    filtered = filtered.filter((i) =>
      i.name.toLowerCase().includes(searchText.toLowerCase())
    )
  }

  if (typeFilter) {
    filtered = filtered.filter((i) => i.type === typeFilter)
  }

  if (rarityFilter) {
    filtered = filtered.filter((i) => i.rarity === rarityFilter)
  }

  if (sortBy === 'type') {
    filtered = [...filtered].sort((a, b) => a.type.localeCompare(b.type))
  } else if (sortBy === 'rarity') {
    filtered = [...filtered].sort((a, b) => a.rarity.localeCompare(b.rarity))
  } else {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg h-screen overflow-y-auto sticky top-0">
      <h2 className="text-xl font-semibold mb-4">Items</h2>

      <button
        onClick={onCreateNew}
        className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        + New Item
      </button>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">Type</label>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
        >
          {ITEM_TYPES.map((t) => (
            <option key={t || 'all'} value={t}>
              {t || 'All Types'}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">Rarity</label>
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
        >
          {RARITIES.map((r) => (
            <option key={r || 'all'} value={r}>
              {r || 'All Rarities'}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none text-sm"
        >
          <option value="name">Name</option>
          <option value="type">Type</option>
          <option value="rarity">Rarity</option>
        </select>
      </div>

      <div className="text-xs text-gray-400 mb-4">
        {isLoading ? 'Loading...' : `${filtered.length} items`}
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            className={`w-full text-left p-3 rounded text-sm transition ${
              selectedItemId === item.id
                ? 'bg-blue-700 border border-blue-400'
                : 'bg-gray-700 border border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-white truncate">{item.name}</p>
              <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded whitespace-nowrap">
                {item.type}
              </span>
            </div>
            <span
              className={`inline-block text-xs text-white px-2 py-1 rounded ${
                rarityColors[item.rarity] || 'bg-gray-500'
              }`}
            >
              {item.rarity}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
