// Import necessary React hooks and libraries
import { useState, useEffect, useRef, useCallback } from 'react';
// Import routing utilities for navigation and URL parameters
import { useParams, useLocation, useNavigate } from 'react-router-dom';
// Import swipe handlers for touch/mouse swipe gestures
import { useSwipeable } from 'react-swipeable';
// Import UI components for card layout
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
// Import icons for navigation buttons
import { FiHeart, FiArrowLeft, FiArrowRight, FiXCircle, FiRefreshCw, FiImage, FiChevronLeft, FiChevronRight, FiCheckCircle } from 'react-icons/fi'; // Added FiCheckCircle
// Import CSS styles for animations
import './ImageSelectorPage.css';
// Import custom components for deck and card details
import DeckDetails from '../components/DeckDetails';
import CardDetails from '../components/CardDetails';
// Import lazy loading wrapper for images
import { LazyLoadWrapper } from '../../../utils/IntersectionObserver';
// Import cache service for storing fetched data
import CacheService from '../../../services/cacheService';

// Main component for deck image selection
const DeckImageSelector = ({ supabase, session }) => {
  // Initialize cache service with Supabase client
  const cacheService = new CacheService(supabase);
  
  // State management:
  const [cards, setCards] = useState([]); // Stores deck/card data
  const [currentIndex, setCurrentIndex] = useState(0); // Current card index
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [selectedImage, setSelectedImage] = useState(null); // Currently selected image
  
  // Handler for rejecting a deck topic
  const handleRejectTopic = async (deckId) => {
    try {
      // Update deck status to 'rejected' in Supabase
      const { error } = await supabase
        .from('decks')
        .update({ 
          status: 'rejected',
          self_image_status: 'rejected'
        })
        .eq('id', deckId);
      
      if (error) throw error;
      // Refresh deck list after update
      fetchDecks();
    } catch (err) {
      console.error('Error rejecting topic:', err);
    }
  };
  
  // Handler for recreating both prompt and image for a deck
  const handleRecreatePromptAndImage = async (deckId) => {
    try {
      // Update deck status to trigger prompt recreation
      const { error } = await supabase
        .from('decks')
        .update({ 
          self_image_status: 'recreate_prompt'
        })
        .eq('id', deckId);
      
      if (error) throw error;
      // Refresh deck list after update
      fetchDecks();
    } catch (err) {
      console.error('Error recreating prompt and image:', err);
    }
  };
  
  // Handler for recreating just the image for a deck
  const handleRecreateImage = async (deckId) => {
    try {
      // Update deck status to trigger image recreation
      const { error } = await supabase
        .from('decks')
        .update({ 
          self_image_status: 'recreate_image'
        })
        .eq('id', deckId);
      
      if (error) throw error;
      // Refresh deck list after update
      fetchDecks();
    } catch (err) {
      console.error('Error recreating image:', err);
    }
  };
  
  // Utility function to ensure we always have 4 images to display
  // Adds placeholder images if there are fewer than 4
  const getImagesToDisplay = (images) => {
    const displayImages = [...images];
    while (displayImages.length < 4) {
      displayImages.push({
        id: `placeholder-${displayImages.length}`,
        url: null,
        title: 'Image not found',
        isPlaceholder: true
      });
    }
    return displayImages.slice(0, 4);
  };
  
  // Configure swipe handlers for touch/mouse gestures
  // Maps swipe directions to navigation functions
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(), // Right swipe goes to next card
    onSwipedRight: () => handlePrevious(), // Left swipe goes to previous card
    preventDefaultTouchmoveEvent: true, // Prevent default browser behavior
    trackMouse: true // Enable mouse drag support
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDeselectImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // REMOVED useEffect for Arrow Key navigation from here

  const { deckId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlIndex = parseInt(searchParams.get('index')) || 0;
  
  useEffect(() => {
    if (urlIndex !== currentIndex) {
      setCurrentIndex(urlIndex);
    }
  }, [urlIndex]);
  
  const deckName = cards[currentIndex]?.cardName || `Deck ID: ${deckId}`;
  const deckDescription = cards[currentIndex]?.cardDescription || '';
  console.log('Navigation state:', location.state); // Debug log to verify state

  useEffect(() => {
    const fetchDecks = async () => {
      setLoading(true);
      setError(null);
      try {
        const cacheKey = `decks:${session?.user?.id}`;
        const cachedData = await cacheService.get(cacheKey);
        
        if (cachedData) {
          setCards(cachedData);
          setLoading(false);
          return;
        }
        
        // First fetch deck data without translations
        const { data: deckData, error: deckError } = await supabase
          .from('decks')
          .select('id, title_key, description_key, asset_url, self_image_status')
          .eq('self_image_status', 'image_created');

        if (deckError) throw deckError;
        if (!deckData || deckData.length === 0) {
          setCards([]);
          setLoading(false);
          return;
        }

        // Separate title and description keys for optimized fetching
        const titleKeys = deckData.map(deck => deck.title_key).filter(Boolean);
        const descriptionKeys = deckData.map(deck => deck.description_key).filter(Boolean);
        let translationMap = {};
        
        // Fetch title translations first
        if (titleKeys.length > 0) {
          const { data: titleTranslations, error: titleError } = await supabase
            .from('translations_en')
            .select('key, value')
            .in('key', titleKeys);
          if (titleError) throw titleError;
          titleTranslations?.forEach(item => {
            translationMap[item.key] = item.value;
          });
        }
        
        // Then fetch description translations
        if (descriptionKeys.length > 0) {
          const { data: descTranslations, error: descError } = await supabase
            .from('translations_en')
            .select('key, value')
            .in('key', descriptionKeys);
          if (descError) throw descError;
          descTranslations?.forEach(item => {
            translationMap[item.key] = item.value;
          });
        }

        const decksWithImages = deckData.map(deck => {
          let assetData = {};
          try {
            assetData = typeof deck.asset_url === 'string' ? JSON.parse(deck.asset_url) : (deck.asset_url || {});
          } catch (parseError) {
            console.error('Error parsing asset_url:', parseError, deck.asset_url);
            assetData = {};
          }

          // Store the base image URL separately
          const baseimageUrl = (assetData.baseimage && typeof assetData.baseimage === 'string') ? assetData.baseimage : null;
          const isImageCreated = deck.status === 'imagecreated'; // Assuming this status check is still relevant
          
          // Filter for standard image keys (e.g., image1, image2, etc.) - Adjust regex if keys differ
          // Corrected regex to match baseimage01, baseimage02, baseimage03, baseimage04
          const imageKeysRegex = /^baseimage0[1-4]$/; 

          const images = Object.entries(assetData)
            .filter(([key, url]) => 
              url && typeof url === 'string' && 
              imageKeysRegex.test(key) // Only include standard image keys
            )
            .map(([key, url]) => ({
              id: key,
              url,
              title: key,
              // Check if this image's URL matches the stored baseimage URL
              isBaseImage: baseimageUrl === url, 
              isImageCreated: isImageCreated // Keep this if needed
            }))
            // Optional: Sort images by key if order isn't guaranteed (e.g., image1, image2...)
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

          // No need to manually prepend baseimage; it's now flagged within the 'images' array.
          // const allImages = []; ... removed

          return {
            ...deck,
            // Pass the processed list (max 4 images, correctly flagged)
            images: images, 
            cardName: deck.title_key ? (translationMap[deck.title_key] || `Key: ${deck.title_key}`) : `ID: ${deck.id}`,
            cardDescription: deck.description_key ? (translationMap[deck.description_key] || `Key: ${deck.description_key}`) : ''
          };
        });

        setCards(decksWithImages);
        await cacheService.set(cacheKey, decksWithImages);
      } catch (error) {
        console.error('Error fetching cards:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [supabase, deckId]);

  const handleImageSelect = (image) => {
    // Prevent selection if conditions aren't met or if it's a placeholder
    // Remove isRejected check
    if (!cards[currentIndex] /*|| image.isRejected*/ || image.isBaseImage || image.isPlaceholder) return;
    
    // Determine the list of images that are valid for the modal
    // Remove isRejected and isBaseImage filter here, only filter placeholders
    const validImagesForModal = getImagesToDisplay(cards[currentIndex].images)
                                .filter(img => !img.isPlaceholder /*&& !img.isRejected && !img.isBaseImage*/);

    // Find the index of the clicked image within this valid list
    const initialIndexInModal = validImagesForModal.findIndex(img => img.id === image.id);

    // Only proceed if the image is actually in the list we'll send to the modal
    if (initialIndexInModal >= 0) {
      setSelectedImage({
        image: image, // Store the initially clicked image object
        initialIndex: initialIndexInModal // Store the index within the filtered list
      });
    } else {
      // Log an error if the clicked image wasn't found in the valid list (shouldn't happen)
      console.error("Clicked image not found in the list of valid images for the modal.");
    }
  };

const handleDeselectImage = () => {
    setSelectedImage(null);
};

const handleConfirmSelection = async (image, cardId) => {
    try {
        const currentDeck = cards[currentIndex];
        let assetData = typeof currentDeck.asset_url === 'string' 
            ? JSON.parse(currentDeck.asset_url) 
            : (currentDeck.asset_url || {});
        
        // Create updated asset data with new baseimage while preserving existing images
        const updatedAssetData = {
            ...assetData,
            baseimage: image.url
        };
        
        const { error } = await supabase
            .from('decks')
            .update({
                asset_url: updatedAssetData,
                self_image_status: 'image_ready'
            })
            .eq('id', currentDeck.id);
        
        if (error) throw error;
        
        // Update local state
        const updatedCards = [...cards];
        updatedCards[currentIndex] = {
            ...updatedCards[currentIndex],
            asset_url: updatedAssetData
        };
        setCards(updatedCards);
        setSelectedImage(null);
        
    } catch (err) {
        console.error('Error confirming selection:', err);
    }
};

const navigate = useNavigate();

// Wrap navigation handlers in useCallback
const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        setSelectedImage(null); // Deselect image when changing card
        navigate(`/deck/${deckId}/deckimages?index=${newIndex}`, { replace: true });
    }
}, [currentIndex, navigate, deckId]); // Add dependencies

const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        setSelectedImage(null); // Deselect image when changing card
        navigate(`/deck/${deckId}/deckimages?index=${newIndex}`, { replace: true });
    }
}, [currentIndex, cards.length, navigate, deckId]); // Add dependencies

// MOVED useEffect for Arrow Key navigation here, AFTER handlePrevious/handleNext
useEffect(() => {
  const handleGridKeyDown = (e) => {
    // Only navigate grid if modal is NOT open
    if (!selectedImage) { 
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    }
  };

  window.addEventListener('keydown', handleGridKeyDown);
  return () => {
    window.removeEventListener('keydown', handleGridKeyDown);
  };
  // Add dependencies: handlePrevious, handleNext, and selectedImage
}, [handlePrevious, handleNext, selectedImage]); 

const CardCounter = () => (
  <div className="flex items-center justify-center mx-4 text-gray-600 font-medium">
    {cards.length > 0 ? `${currentIndex + 1} of ${cards.length}` : '0 of 0'}
  </div>
);

const ActionButtons = ({ deckId }) => (
  <div className="flex space-x-4 ml-4">
    <button 
      onClick={() => handleRejectTopic(deckId)}
      className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
      title="Reject this deck topic and all its images"
    >
      <FiXCircle size={20} />
    </button>
    <button 
      onClick={() => handleRecreatePromptAndImage(deckId)}
      className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center"
      title="Regenerate both the prompt and image for this deck"
    >
      <FiRefreshCw size={20} />
    </button>
    <button 
      onClick={() => handleRecreateImage(deckId)}
      className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center justify-center"
      title="Regenerate just the image using the existing prompt"
    >
      <FiImage size={20} />
    </button>
  </div>
);

const pulseAnimation = {
  '0%': { transform: 'scale(1)', color: 'red' },
  '50%': { transform: 'scale(1.3)', color: 'red' },
  '100%': { transform: 'scale(1)', color: 'red' }

};

const renderImage = (image) => {
  const style = image.isBaseImage ? 'border-2 border-yellow-400' : 
                /*image.isRejected ? 'opacity-50' :*/ 
                selectedImage?.image?.id === image.id ? 'border-3 border-blue-500' : ''; // Corrected selectedImage check
  
  return (
    <div key={image.id} className={`relative rounded-lg overflow-hidden ${style} aspect-[2/3]`}> {/* Added aspect ratio */} 
      <img 
        src={image.url} 
        alt={image.title || 'Deck image'} // Added fallback alt text
        className={`w-full h-full object-cover cursor-pointer hover:opacity-90 ${/*image.isRejected ||*/ image.isBaseImage || image.isPlaceholder ? 'cursor-not-allowed' : ''}`} // Add cursor style for non-selectable
        onClick={() => handleImageSelect(image)}
        // Prevent drag ghost image
        onDragStart={(e) => e.preventDefault()}
      />
      {/* Add Heart icon if it's the base image */}
      {image.isBaseImage && (
        <FiHeart 
          className="absolute top-2 right-2 text-red-500 fill-current"
          size={20}
          title="Current Base Image"
        />
      )}
    </div>
  );
};

// Modify ImageModal to accept new props and manage internal state
const ImageModal = ({ initialImage, initialIndex, images, onClose, onConfirm }) => {
  // State to track the currently displayed image index within the modal
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const modalRef = useRef(null); // Ref for the modal container for focus management
  
  // Get the image object based on the current index
  const currentImage = images[currentImageIndex];
  const totalImages = images.length;

  // Basic check to prevent errors if images array is empty or index is out of bounds
  if (!images || images.length === 0 || !currentImage) {
    console.error("ImageModal: Invalid images array or index.", { initialIndex, images });
    return null; // Don't render anything if data is invalid
  }

  // --- Navigation Logic (wrapped in useCallback for useEffect dependency) ---
  const handleNextImage = useCallback(() => {
    // Stop at the last image
    setCurrentImageIndex((prevIndex) => 
      prevIndex < totalImages - 1 ? prevIndex + 1 : prevIndex
    );
  }, [totalImages]); // Dependency: totalImages

  const handlePreviousImage = useCallback(() => {
    // Stop at the first image
    setCurrentImageIndex((prevIndex) => 
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  }, []); // No dependency needed as totalImages isn't used for the lower bound
  // --- End Navigation Logic ---

  // --- Keyboard Navigation ---
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const handleKeyDown = (e) => {
      e.stopPropagation(); // Prevent conflict with other listeners
      if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        handlePreviousImage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    modalElement.addEventListener('keydown', handleKeyDown);
    modalElement.focus(); // Focus the modal to capture key events

    return () => {
      if (modalElement) {
        modalElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [handleNextImage, handlePreviousImage, onClose]); // Dependencies
  // --- End Keyboard Navigation ---

  // --- Swipe Navigation ---
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      eventData.event.stopPropagation();
      handleNextImage();
    },
    onSwipedRight: (eventData) => {
      eventData.event.stopPropagation();
      handlePreviousImage();
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true, 
  });
  // --- End Swipe Navigation ---

  return (
    // Add ref and tabIndex to make the outer div focusable
    <div ref={modalRef} tabIndex="-1" className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 outline-none" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      {/* Content Container (handles swipes) */}
      <div {...swipeHandlers} className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center">
        {/* Image Container with Navigation Arrows */}
        <div className="relative w-full max-w-xl mb-4"> {/* Increased max-width from md to xl */} 
          {/* Previous Button - Removed background, adjusted position/size */}
          <button
            onClick={handlePreviousImage}
            className="absolute left-[-50px] top-1/2 -translate-y-1/2 z-20 text-white hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous image"
            disabled={currentImageIndex <= 0} // Disable when at the first image
          >
            <FiChevronLeft size={40} /> {/* Increased size */} 
          </button>

          {/* Image - Removed inner black box, added rounded corners, increased max-height */}
          <img 
            src={currentImage.url} // Display image based on internal state
            alt={currentImage.title} // Use alt from current image
            className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-xl" // Increased rounding from rounded-lg to rounded-2xl
          />

          {/* Next Button - Removed background, adjusted position/size */}
          <button
            onClick={handleNextImage}
            className="absolute right-[-50px] top-1/2 -translate-y-1/2 z-20 text-white hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next image"
            disabled={currentImageIndex >= totalImages - 1} // Disable when at the last image
          >
            <FiChevronRight size={40} /> {/* Increased size */} 
          </button>
        </div>

        {/* Action Buttons (Tinder Style) */}
        <div className="flex justify-center space-x-10 mt-6"> {/* Increased spacing and margin-top */} 
          {/* Cancel Button (Red Cross) */}
          <button 
            className="p-5 bg-white/10 hover:bg-white/20 text-red-500 rounded-full transition-colors shadow-lg"
            onClick={onClose}
            aria-label="Cancel"
          >
            <FiXCircle size={36} /> {/* Increased padding and icon size */} 
          </button>
          {/* Confirm Button (Green Tick) */}
          <button 
            className="p-5 bg-white/10 hover:bg-white/20 text-green-500 rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onConfirm(currentImage)} // Pass the currently displayed image
            aria-label="Confirm Selection"
            // Disable confirm if the current image is invalid for selection
            disabled={currentImage.isPlaceholder || currentImage.isBaseImage}
          >
            <FiCheckCircle size={36} /> {/* Increased padding and icon size */} 
          </button>
        </div>
      </div>
    </div>
  );
};

return (
  <div className="container mx-auto px-4 py-2">
    {selectedImage && (() => {
        // Prepare props for ImageModal
        // Only filter placeholders now
        const validImagesForModal = getImagesToDisplay(cards[currentIndex].images)
                                    .filter(img => !img.isPlaceholder /*&& !img.isRejected && !img.isBaseImage*/);
        const modalProps = {
          initialImage: selectedImage.image, // Pass the initially clicked image object
          initialIndex: selectedImage.initialIndex, // Pass the calculated index
          images: validImagesForModal, // Pass the filtered list of images
          onClose: handleDeselectImage,
          // Pass the current image from the modal state to handleConfirmSelection
          // This will be adjusted inside ImageModal later
          onConfirm: (currentModalImage) => handleConfirmSelection(currentModalImage, cards[currentIndex]?.id) 
        };

        return (
          <ImageModal {...modalProps} />
        );
      })()}
    {loading ? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    ) : error ? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          Error: {error}
        </div>
      </div>
    ) : cards.length > 0 ? (
      <div {...swipeHandlers} className="flex flex-col h-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pl-0 pr-4 py-2 gap-2 md:gap-0">
          <div className="w-full md:w-1/2">
            <DeckDetails deckName={deckName} deckDescription={deckDescription} />
          </div>
          {cards.length > 0 && <ActionButtons deckId={cards[currentIndex].id} />}
        </div>
        
        
        <div className="flex-1 grid grid-cols-1 gap-2 mt-2">
          <div className="grid grid-cols-2 gap-4 md:flex md:overflow-x-auto md:space-x-4 pb-4">
            {cards[currentIndex].images.map((image) => (
            <LazyLoadWrapper key={image.id} rootMargin="200px" threshold={0.1}>
              {renderImage(image)}
            </LazyLoadWrapper>
          ))}
          </div>
          <div className="flex items-center justify-center mt-4">
            <button 
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              <FiArrowLeft />
            </button>
            <CardCounter />
            <button 
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center text-gray-600 mt-8">
        No cards available for this deck
      </div>
    )}
  </div>
);

}
export default DeckImageSelector;