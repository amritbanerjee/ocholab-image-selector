import { useState, useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import { useParams } from 'react-router-dom'

const ImageSelection = ({ supabase, session }) => {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { deckId } = useParams()

  useEffect(() => {
    // In a real app, you would fetch images from Supabase
    // This is a placeholder implementation
    const fetchImages = async () => {
      setLoading(true)
      try {
        // Example of how you might fetch images from Supabase
        // const { data, error } = await supabase
        //   .from('images')
        //   .select('*')
        //   .order('created_at', { ascending: false })

        // if (error) throw error
        
        // Placeholder data
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .eq('status', 'choosebaseimage')
          .eq('deck_id', deckId)
          
        if (error) throw error
        
        const cardsWithImages = data.map(card => {
          try {
            // Handle case where asset_url is already an object
            const assetData = typeof card.asset_url === 'string' 
              ? JSON.parse(card.asset_url) 
              : card.asset_url;
              
            return {
              ...card,
              images: Object.entries(assetData).map(([key, url]) => ({
                id: key,
                url,
                title: key
              }))
            }
          } catch (parseError) {
            console.error('Error parsing asset_url:', parseError)
            return {
              ...card,
              images: []
            }
          }
        })

        setImages(cardsWithImages)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [supabase])

  const handleImageSelect = async (selectedImage) => {
    try {
      // Update card in Supabase with selected image
      const { error } = await supabase
        .from('cards')
        .update({ 
          status: 'imagechosen',
          selected_image: selectedImage.url,
          asset_url: JSON.stringify({
            selected: selectedImage.url,
            ...images[currentIndex].images.reduce((acc, img) => ({
              ...acc,
              [img.id]: img.url
            }), {})
          })
        })
        .eq('id', images[currentIndex].id)
      
      if (error) throw error
      
      // Move to next card
      if (currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const handleLike = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleDislike = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => handleDislike(),
    onSwipedRight: () => handleLike(),
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

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-sm text-gray-700 bg-gray-100 rounded-lg" role="alert">
          No images available
        </div>
      </div>
    )
  }

  if (currentIndex >= images.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
          You've reviewed all images!
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Image Selection</h1>
      
      <div className="flex items-center justify-center space-x-4 w-full max-w-2xl">
        <button 
          onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
          className="p-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
          disabled={currentIndex === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="grid grid-cols-2 gap-4 w-full">
        {images[currentIndex].images.map((image) => (
          <div 
            key={image.id}
            className="relative aspect-[3/4] bg-white rounded-lg shadow-lg overflow-hidden"
            onClick={() => handleImageSelect(image)}
          >
            <img 
              src={image.url} 
              alt={image.title}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <h2 className="text-xl font-semibold text-white">{image.title}</h2>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => currentIndex < images.length - 1 && setCurrentIndex(currentIndex + 1)}
        className="p-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
        disabled={currentIndex === images.length - 1}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      </div>

      <div className="flex justify-center space-x-8 mt-8">
        <button 
          onClick={handleDislike}
          className="p-4 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button 
          onClick={handleLike}
          className="p-4 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      <div className="mt-6 text-gray-600">
        Image {currentIndex + 1} of {images.length}
      </div>
    </div>
  )
}

export default ImageSelection