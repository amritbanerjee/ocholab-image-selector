import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const ProtectedRoute = ({ children, session, supabase }) => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!session) {
        setLoading(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAdmin(user?.user_metadata?.role === 'admin')
      } catch (error) {
        console.error('Error checking admin role:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAdminRole()
  }, [session, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute