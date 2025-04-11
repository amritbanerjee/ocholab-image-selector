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

  if (!session || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute