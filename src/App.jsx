import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import ImageSelection from './components/ImageSelection'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import Home from './components/pages/Home'
import { supabase } from './lib/supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <Router basename="/ocholab-image-selector">
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Login supabase={supabase} />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <Navbar />
                <Home />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/image-selection" 
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <Navbar />
                <ImageSelection supabase={supabase} session={session} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App