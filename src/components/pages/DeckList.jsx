import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DeckList = ({ supabase, session }) => {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

// ... existing imports and state ...

useEffect(() => {
  const fetchDecks = async () => {
    try {
      setLoading(true);
      
      // First get cards with deck info to extract title_keys
      const { data, error } = await supabase
        .from('cards')
        .select(`
          deck_id,
          decks!deck_id(
            id,
            title_key
          )
        `)
        .eq('status', 'choosebaseimage');

      console.log('Raw API response:', data); // Log raw response

      if (error) throw error;

            // Extract unique title_keys
            const titleKeys = [...new Set(data.map(card => card.decks?.title_key))].filter(Boolean);
      
            // Sanitize keys by escaping special characters
            const sanitizedTitleKeys = titleKeys.map(key => 
              encodeURIComponent(key)
            );
      
            // Then get translations for these title_keys
            const { data: translations, error: translationsError } = await supabase
              .from('translations_en')
              .select('key, value')
              .in('key', sanitizedTitleKeys)
              .limit(1000); // Add high limit as safeguard
      
            // Map back to original keys for display
            const translationMap = translations?.reduce((acc, item) => {
              acc[decodeURIComponent(item.key)] = item.value;
              return acc;
            }, {});
      
            // Create deck objects with translations
            const decksWithTitles = [...new Set(data.map(card => card.deck_id))].map(deckId => {
              const card = data.find(c => c.deck_id === deckId);
              const originalKey = card?.decks?.title_key;
              return {
                id: deckId,
                title: originalKey ? translationMap?.[originalKey] || `Deck ${deckId}` : `Deck ${deckId}`
              };
            });

      setDecks(decksWithTitles);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchDecks();
}, [supabase]);

// ... rest of the component ...

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

// ... existing code ...

return (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-6">Available Decks for Review</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <button
          key={deck.id}
          onClick={() => handleDeckClick(deck.id)}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">{deck.title}</h2>
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

// ... rest of the component ...
}

export default DeckList