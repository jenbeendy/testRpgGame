import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/recipes', label: 'Recipe Editor' },
    { path: '/admin/items', label: 'Item Templates' },
    { path: '/admin/import', label: 'Batch Import' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-1/5 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8">Admin</h2>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded transition ${
                isActive(item.path)
                  ? 'bg-blue-700 border-l-4 border-blue-400'
                  : 'hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="w-4/5 bg-gray-900 p-8 overflow-auto">
        {children}
      </div>
    </div>
  )
}
