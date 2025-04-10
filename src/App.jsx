import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import Login from './components/Login'
import ImageSelection from './components/ImageSelection'
import ProtectedRoute from './components/ProtectedRoute'

// Initialize Supabase client using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project-url.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

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
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={session ? <Navigate to="/select" /> : <Login supabase={supabase} />} />
        <Route 
          path="/select" 
          element={
            <ProtectedRoute session={session} supabase={supabase}>
              <ImageSelection supabase={supabase} session={session} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  )
}

export default App