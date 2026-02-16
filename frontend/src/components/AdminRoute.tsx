import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)

  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
