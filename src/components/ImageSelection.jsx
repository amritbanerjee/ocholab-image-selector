import { useState, useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import { useParams, useLocation } from 'react-router-dom'

const ImageSelection = ({ supabase, session }) => {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { deckId } = useParams()
  const location = useLocation()
  const deckName = location.state?.deckName || 'Deck'

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true)
      try {
        // Fetch cards for this deck
        const { data, error } = await supabase
          .from('cards')
          .select('*, deck_id')
          .eq('status', 'choosebaseimage')
          .eq('deck_id', deckId)
        if (error) throw error
        // Get all title_keys
        const titleKeys = data.map(card => card.title_key).filter(Boolean)
        // Fetch translations for all title_keys
        let translationMap = {}
        if (titleKeys.length > 0) {
          const { data: translations, error: translationsError } = await supabase
            .from('translations_en')
            .select('key, value')
            .in('key', titleKeys)
          if (translationsError) throw translationsError
          translationMap = translations.reduce((acc, item) => {
            acc[item.key] = item.value
            return acc
          }, {})
        }
        const cardsWithImages = data.map(card => {
          let assetData = {}
          try {
            assetData = typeof card.asset_url === 'string' ? JSON.parse(card.asset_url) : card.asset_url
          } catch (parseError) {
            assetData = {}
          }
          return {
            ...card,
            images: Object.entries(assetData).map(([key, url]) => ({
              id: key,
              url,
              title: key
            })),
            cardName: card.title_key ? translationMap[card.title_key] || `ID: ${card.id}` : `ID: ${card.id}`
          }
        })
        setCards(cardsWithImages)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCards()
  }, [supabase, deckId])

  const handleImageSelect = async (selectedImage) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({
          status: 'imagechosen',
          selected_image: selectedImage.url,
          asset_url: JSON.stringify({
            selected: selectedImage.url,
            ...cards[currentIndex].images.reduce((acc, img) => ({ ...acc, [img.id]: img.url }), {})
          })
        })
        .eq('id', cards[currentIndex].id)
      if (error) throw error
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1))
  }
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1))
  }

  const handlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          Error loading images: {error}
        </div>
      </div>
    )
  }
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-sm text-gray-700 bg-gray-100 rounded-lg" role="alert">
          No images available
        </div>
      </div>
    )
  }
  if (currentIndex >= cards.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
          You've reviewed all images!
        </div>
      </div>
    )
  }
  const card = cards[currentIndex]
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 pt-20" {...handlers}>
      <div className="w-full max-w-2xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{deckName}</h1>
          <span className="text-lg text-gray-700 font-medium mt-2 md:mt-0">{card.cardName}</span>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <button onClick={handlePrev} className="p-2 text-gray-700 hover:text-gray-900 disabled:opacity-50" disabled={cards.length <= 1}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="grid grid-cols-2 gap-4 w-full">
            {card.images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-[3/4] bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-300 transition"
                onClick={() => handleImageSelect(image)}
              >
                <img src={image.url} alt={image.title} className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h2 className="text-xl font-semibold text-white">{image.title}</h2>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleNext} className="p-2 text-gray-700 hover:text-gray-900 disabled:opacity-50" disabled={cards.length <= 1}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex justify-center space-x-8 mt-8">
        <button onClick={handlePrev} className="p-4 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors" disabled={cards.length <= 1}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button onClick={handleNext} className="p-4 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-colors" disabled={cards.length <= 1}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
      <div className="mt-6 text-gray-600">
        Card {currentIndex + 1} of {cards.length}
      </div>
    </div>
  )
}

export default ImageSelection