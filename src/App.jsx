import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import ImageSelection from './components/ImageSelection'
// import DeckList from './components/pages/DeckList' // Old import
import DeckListPage from './pages/DeckListPage'; // New import
import Navbar from './components/layout/Navbar'
// import Home from './components/pages/Home' // Old import
// import DashboardPage from './components/pages/DashboardPage'; // Old import
import HomePage from './pages/HomePage'; // New import

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
        {/* Conditional Navbar rendering might need adjustment based on HomePage layout */}
        {/* Consider removing Navbar if HomePage includes its own header/sidebar */}
        {/* {window.location.pathname !== "/ocholab-image-selector/dashboard" && <Navbar />} */}
        <Routes>
          <Route path="/login" element={<Login supabase={supabase} />} /> {/* Changed path from / to /login */} 
          <Route
            path="/"
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <HomePage supabase={supabase} session={session} /> {/* Default route */} 
              </ProtectedRoute>
            }
          />
          {/* Removed /home route */}
          {/* Removed /dashboard route */}
          {/* Removed generic /image-selection route */}
          <Route
            path="/decks" // Changed path from /cards-for-review
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <DeckListPage supabase={supabase} session={session} /> {/* Use renamed component */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/deck/:deckId/images"
            element={
              <ProtectedRoute session={session} supabase={supabase}>
                <ImageSelection supabase={supabase} session={session} /> {/* Keep for now, consider DeckImageViewerPage later */}
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App