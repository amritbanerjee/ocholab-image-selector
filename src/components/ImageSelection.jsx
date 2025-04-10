import { useState, useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'

const ImageSelection = ({ supabase, session }) => {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        const placeholderImages = [
          { id: 1, url: 'https://picsum.photos/id/1/500/500', title: 'Image 1' },
          { id: 2, url: 'https://picsum.photos/id/2/500/500', title: 'Image 2' },
          { id: 3, url: 'https://picsum.photos/id/3/500/500', title: 'Image 3' },
          { id: 4, url: 'https://picsum.photos/id/4/500/500', title: 'Image 4' },
          { id: 5, url: 'https://picsum.photos/id/5/500/500', title: 'Image 5' },
        ]

        setImages(placeholderImages)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [supabase])

  const handleLike = async () => {
    if (currentIndex >= images.length - 1) return
    
    // In a real app, you would save the like to Supabase
    console.log(`Liked image: ${images[currentIndex].id}`)
    
    // Move to next image
    setCurrentIndex(currentIndex + 1)
  }

  const handleDislike = async () => {
    if (currentIndex >= images.length - 1) return
    
    // In a real app, you would save the dislike to Supabase
    console.log(`Disliked image: ${images[currentIndex].id}`)
    
    // Move to next image
    setCurrentIndex(currentIndex + 1)
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
      
      <div 
        {...handlers}
        className="relative w-full max-w-md aspect-square bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <img 
          src={images[currentIndex].url} 
          alt={images[currentIndex].title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h2 className="text-xl font-semibold text-white">{images[currentIndex].title}</h2>
        </div>
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