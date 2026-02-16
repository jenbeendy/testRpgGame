import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const cards = [
    {
      title: 'Recipe Editor',
      description: 'Create and manage crafting recipes',
      path: '/admin/recipes',
      disabled: false,
    },
    {
      title: 'Item Templates',
      description: 'Create and manage item templates',
      path: '/admin/items',
      disabled: false,
    },
    {
      title: 'Batch Import',
      description: 'Import recipes and items in bulk',
      path: '/admin/import',
      disabled: true,
    },
  ]

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-400 mb-12">Manage recipes, items, and game content</p>

        <div className="grid grid-cols-2 gap-6">
          {cards.map((card) => (
            <button
              key={card.path}
              onClick={() => !card.disabled && navigate(card.path)}
              disabled={card.disabled}
              className={`p-6 rounded-lg transition text-left ${
                card.disabled
                  ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
              }`}
            >
              <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm">{card.description}</p>
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
