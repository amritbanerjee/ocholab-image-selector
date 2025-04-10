import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, session }) => {
  if (!session) {
    // Redirect to login if there's no session
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute