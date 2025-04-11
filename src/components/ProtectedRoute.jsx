import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const AccessDenied = ({ supabase }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="mb-6 text-gray-600">Oops! Sorry you do not have access to this website.</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

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
        const { data: profile, error: profileError } = await supabase
          .from('profile')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setIsAdmin(false)
          return
        }

        setIsAdmin(profile?.role === 'admin')
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

  if (!session) {
    // Check if we're already on the login page to prevent redirect loops
    if (window.location.pathname !== '/') {
      return <Navigate to="/" replace />
    }
    return null
  }

  if (!isAdmin) {
    return <AccessDenied supabase={supabase} />
  }

  return children
}

export default ProtectedRoute