import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import ImageSelectorPage from './features/content_dashboard/pages/ImageSelectorPage'; // Updated path with extension
import DeckListPage from './features/content_dashboard/pages/DeckListPage'; // Corrected path to actual filename
import DeckImageSelector from './features/content_dashboard/pages/DeckImageSelector';
// import Navbar from './components/layout/Navbar' // Removed, layout handles navigation
import HomePage from './features/content_dashboard/pages/HomePage'; // Updated path
import MainLayout from './components/layout/MainLayout'; // Import the new layout

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
    <Router>
      <Routes>
        <Route path="/login" element={<Login supabase={supabase} />} />
        {/* Root path redirects to login when no session exists */}
        <Route path="/" element={session ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
        {/* Protected routes wrapped by MainLayout */}
        <Route 
          element={
            <ProtectedRoute session={session} supabase={supabase}>
              {/* Pass session and supabase down to MainLayout */}
              <MainLayout session={session} supabase={supabase} />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomePage supabase={supabase} session={session} />} />
          <Route path="/decks" element={<DeckListPage supabase={supabase} session={session} />} />
          <Route path="/deck/:deckId/images" element={<ImageSelectorPage supabase={supabase} session={session} />} />
          <Route path="/deck/:deckId/deckimages" element={<DeckImageSelector supabase={supabase} session={session} />} />
          {/* Add other protected routes here as children of MainLayout */}
        </Route>
      </Routes>
    </Router>
  )
}

export default App