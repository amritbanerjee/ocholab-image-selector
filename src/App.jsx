import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import ImageSelection from './components/ImageSelection'
import DeckList from './components/pages/DeckList'
import Navbar from './components/layout/Navbar'
import Home from './components/pages/Home'
import DashboardPage from './components/pages/DashboardPage';

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
        {window.location.pathname !== "/ocholab-image-selector/dashboard" && <Navbar />}
        <Routes>
          <Route path="/" element={<Login supabase={supabase} />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <Home supabase={supabase} session={session} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <DashboardPage supabase={supabase} session={session} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/image-selection"
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <ImageSelection supabase={supabase} session={session} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cards-for-review"
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <DeckList supabase={supabase} session={session} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deck/:deckId/images"
            element={
              <ProtectedRoute session={session} supabase={supabase}>
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