import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DeckList = ({ supabase, session }) => {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setLoading(true)
        // Fetch cards with status 'choosebaseimage' and get unique deck_ids
        const { data, error } = await supabase
          .from('cards')
          .select('deck_id')
          .eq('status', 'choosebaseimage')
          .order('deck_id')

        if (error) throw error

        // Get unique deck_ids
        const uniqueDecks = [...new Set(data.map(card => card.deck_id))]
        setDecks(uniqueDecks)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDecks()
  }, [supabase])

  const handleDeckClick = (deckId) => {
    navigate(`/deck/${deckId}/images`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          Error loading decks: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Available Decks for Review</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deckId) => (
          <button
            key={deckId}
            onClick={() => handleDeckClick(deckId)}
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Deck {deckId}</h2>
            <p className="text-gray-600">Click to review images</p>
          </button>
        ))}
      </div>
      {decks.length === 0 && (
        <div className="text-center text-gray-600 mt-8">
          No decks available for review
        </div>
      )}
    </div>
  )
}

export default DeckList