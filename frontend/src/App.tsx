import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AdminRecipesPage from './pages/AdminRecipesPage'
import AdminItemsPage from './pages/AdminItemsPage'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/recipes"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <AdminRecipesPage />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/items"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <AdminItemsPage />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
