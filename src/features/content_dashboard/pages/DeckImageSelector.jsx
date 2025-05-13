// Import necessary React hooks and libraries
import { useState, useEffect, useRef, useCallback } from 'react';
// Import routing utilities for navigation and URL parameters
import { useParams, useLocation, useNavigate } from 'react-router-dom';
// Import swipe handlers for touch/mouse swipe gestures
import { useSwipeable } from 'react-swipeable';
// Import UI components for card layout
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
// Import icons for navigation buttons
// Removed FiImage as it's now handled by DeckImageCard
import { FiHeart, FiArrowLeft, FiArrowRight, FiXCircle, FiRefreshCw, FiChevronLeft, FiChevronRight, FiCheckCircle } from 'react-icons/fi'; 
// Import CSS styles for animations
import './ImageSelectorPage.css';
// Import custom components for deck and card details
import DeckDetails from '../components/DeckDetails';
import CardDetails from '../components/CardDetails';
// Import the new DeckImageCard component
import DeckImageCard from '../components/DeckImageCard'; 
// Import the new StarRating component
import StarRating from '../components/StarRating'; 
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
  const [successMessage, setSuccessMessage] = useState(''); // State for success messages
  
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
      setSuccessMessage('Deck Rejected');
      setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
      // Refresh deck list after update - REMOVED fetchDecks()
      // fetchDecks(); 
    } catch (err) {
      console.error('Error rejecting topic:', err);
      setError('Failed to reject topic.');
      setTimeout(() => setError(null), 3000);
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
      setSuccessMessage('Deck sent for prompt and image recreation');
      setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
      // Refresh deck list after update - REMOVED fetchDecks()
      // fetchDecks();
    } catch (err) {
      console.error('Error recreating prompt and image:', err);
      setError('Failed to recreate prompt and image.');
      setTimeout(() => setError(null), 3000);
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
      setSuccessMessage('Deck sent for image recreation');
      setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
      // Refresh deck list after update - REMOVED fetchDecks()
      // fetchDecks();
    } catch (err) {
      console.error('Error recreating image:', err);
      setError('Failed to recreate image.');
      setTimeout(() => setError(null), 3000);
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
        isPlaceholder: true,
        // Ensure placeholders have isBaseImage false if needed elsewhere
        isBaseImage: false 
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
        // Add 'rating' to the select query
        const { data: deckData, error: deckError } = await supabase
          .from('decks')
          .select('id, title_key, description_key, asset_url, self_image_status, rating') // Added rating
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

          // Parse rating JSONB
          let ratingData = {};
          try {
            ratingData = typeof deck.rating === 'string' ? JSON.parse(deck.rating) : (deck.rating || {});
          } catch (parseError) {
            console.error('Error parsing rating:', parseError, deck.rating);
            ratingData = {};
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
            cardDescription: deck.description_key ? (translationMap[deck.description_key] || `Key: ${deck.description_key}`) : '',
            // Store the parsed rating data
            rating: ratingData 
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

  // Updated handleImageSelect to accept hasError from DeckImageCard
  const handleImageSelect = (image, hasError) => {
    // Prevent selection if conditions aren't met, if it's a placeholder, OR if it has an error
    if (!cards[currentIndex] || image.isBaseImage || image.isPlaceholder || hasError) return;
    
    // Determine the list of images that are valid for the modal
    // Filter out placeholders AND images that DeckImageCard reported as having errors
    // We need a way to know which images have errors *before* filtering.
    // Let's assume for now getImagesToDisplay provides the full list including potential errors
    // We'll need to adjust how we get the valid list.

    // --- REVISED LOGIC --- 
    // 1. Get the full list of potential images for the current card
    const potentialImages = getImagesToDisplay(cards[currentIndex].images);

    // 2. Filter this list to only include images that are NOT placeholders AND do NOT have loading errors.
    //    We rely on DeckImageCard having correctly set its internal `hasError` state for each image.
    //    Since DeckImageCard manages its own error state, we can't directly filter based on it here.
    //    INSTEAD: We should filter the list *before* passing it to the modal.

    // Find the index of the clicked image within the *original* potentialImages list
    const originalIndex = potentialImages.findIndex(img => img.id === image.id);

    // If the clicked image itself has an error (passed from DeckImageCard), do nothing.
    if (hasError) {
      console.log("Preventing modal open for image with error:", image.url);
      return;
    }

    // Filter the potential images *after* confirming the clicked one is okay
    // This list will be passed to the modal
    const validImagesForModal = potentialImages.filter(img => !img.isPlaceholder /* && !img.hasError - We need to track this */);
    // TODO: We need a way to track 'hasError' status at this level, perhaps by lifting state up
    //       or by re-validating URLs here (less ideal).
    //       For now, let's assume the clicked image check is sufficient, but acknowledge this limitation.

    // Find the index of the clicked image within the *filtered* list for the modal's initial state
    const initialIndexInModal = validImagesForModal.findIndex(img => img.id === image.id);

    // Only proceed if the image is actually in the list we'll send to the modal
    if (initialIndexInModal >= 0) {
      setSelectedImage({
        image: image, // Store the initially clicked image object
        initialIndex: initialIndexInModal, // Store the index within the filtered list
        // Pass the filtered list to the modal
        images: validImagesForModal 
      });
    } else {
      // Log an error if the clicked image wasn't found in the valid list (shouldn't happen if !hasError)
      console.error("Clicked image not found in the list of valid images for the modal, despite not having an error.");
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

// --- Handler for Rating Update (Placeholder for now) ---
const handleRatingUpdate = async (newRating) => {
  const currentDeck = cards[currentIndex];
  if (!currentDeck) return;

  console.log(`Updating rating for deck ${currentDeck.id} to ${newRating}`);
  // Prepare the data: null if rating is 0, otherwise {userrating: newRating}
  const updatedRatingJson = newRating === 0 ? null : { userrating: newRating };
  const originalRating = currentDeck.rating; // Store original for potential revert

  // Update local cards state optimistically
  const updatedCards = cards.map((card, index) => {
    if (index === currentIndex) {
      return { ...card, rating: updatedRatingJson };
    }
    return card;
  });
  setCards(updatedCards);

  // Actual DB update
  try {
    const { error } = await supabase
      .from('decks')
      .update({ rating: updatedRatingJson }) // Overwrite the rating column
      .eq('id', currentDeck.id);
    
    if (error) throw error;
    console.log('DB update successful');
    setSuccessMessage('Rating updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    // Optionally clear cache if needed after update
    // await cacheService.clear(`decks:${session?.user?.id}`);

  } catch (err) {
    console.error('Error updating rating in DB:', err);
    // Revert local state change on error
    const revertedCards = cards.map((card, index) => {
      if (index === currentIndex) {
        return { ...card, rating: originalRating }; // Revert to original rating
      }
      return card;
    });
    setCards(revertedCards);
    // Optionally show an error message to the user
    setError(`Failed to update rating: ${err.message}`);
    setTimeout(() => setError(null), 3000);
  }
};

const CardCounter = () => (
  <div className="flex items-center justify-center mx-4 text-gray-600 font-medium">
    {cards.length > 0 ? `${currentIndex + 1} of ${cards.length}` : '0 of 0'}
  </div>
);

const ActionButtons = ({ deckId, currentRating, onRatingChange }) => (
  // Use flex container to align buttons and stars
  <div className="flex items-center space-x-4 ml-4">
    {/* Existing Buttons */}
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
      {/* Use FiRefreshCw or another appropriate icon if FiImage was only for this */}
      <FiRefreshCw size={20} /> 
    </button>

    {/* Add Star Rating Component */}
    <div className="ml-auto pl-4"> {/* Push stars to the right */} 
      <StarRating 
        currentRating={currentRating} 
        onRatingChange={onRatingChange} 
      />
    </div>
  </div>
);

// REMOVED the old renderImage function entirely
/*
const renderImage = (image) => {
  // ... old implementation ...
};
*/

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
        <div className="relative w-full max-w-xl mb-4">
          {/* Previous Button */}
          <button
            onClick={handlePreviousImage}
            className="absolute left-[-50px] top-1/2 -translate-y-1/2 z-20 text-white hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous image"
            disabled={currentImageIndex <= 0}
          >
            <FiChevronLeft size={40} />
          </button>

          {/* Image Container Div - Apply rounding and shadow here */}
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <img 
              src={currentImage.url} 
              alt={currentImage.title}
              // Removed styling from img, applied to parent div
              className="w-full h-auto max-h-[80vh] object-contain" 
            />
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextImage}
            className="absolute right-[-50px] top-1/2 -translate-y-1/2 z-20 text-white hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next image"
            disabled={currentImageIndex >= totalImages - 1}
          >
            <FiChevronRight size={40} />
          </button>
        </div>

        {/* Action Buttons (Cancel/Confirm) */}
        <div className="flex items-center justify-center space-x-10 mt-6">
          {/* Cancel Button */}
          <button 
            onClick={onClose} 
            className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 ease-in-out transform hover:scale-110"
            aria-label="Cancel selection"
          >
            <FiXCircle size={36} />
          </button>
          {/* Confirm Button - Disable if it's the base image or placeholder */}
          <button 
            onClick={() => onConfirm(currentImage)} 
            className={`p-5 bg-green-500 text-white rounded-full transition-all duration-200 ease-in-out transform ${currentImage.isBaseImage || currentImage.isPlaceholder ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600 hover:scale-110'}`}
            aria-label="Confirm selection"
            disabled={currentImage.isBaseImage || currentImage.isPlaceholder}
          >
            <FiCheckCircle size={36} />
          </button>
        </div>
      </div>
    </div>
  );
};

  // Main component render - REVERTING LAYOUT STRUCTURE HERE
  if (loading) return <div className="flex justify-center items-center h-screen">Loading decks...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  if (!cards || cards.length === 0) return <div className="flex justify-center items-center h-screen">No decks found matching the criteria.</div>;

  const currentCard = cards[currentIndex];
  if (!currentCard) return <div className="flex justify-center items-center h-screen">Card not found at index {currentIndex}.</div>;

  // Ensure we always get 4 images/placeholders for the grid
  const imagesToDisplay = getImagesToDisplay(currentCard.images || []);

  // Use the layout structure from *before* the last edit, but integrate DeckImageCard
  return (
    <div className="container mx-auto px-4 py-2">
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Modal Rendering Logic (Keep as is) */}
      {selectedImage && (() => {
          const validImagesForModal = getImagesToDisplay(currentCard.images)
                                      .filter(img => !img.isPlaceholder);
          const modalProps = {
            initialImage: selectedImage.image,
            initialIndex: selectedImage.initialIndex,
            images: validImagesForModal,
            onClose: handleDeselectImage,
            onConfirm: (currentModalImage) => handleConfirmSelection(currentModalImage, currentCard?.id)
          };
          return <ImageModal {...modalProps} />;
        })()}
      
      {/* Main Content Area (Restored Layout) */}
      <div {...swipeHandlers} className="flex flex-col h-full">
        {/* Top Section: Details and Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pl-0 pr-4 py-2 gap-2 md:gap-0">
          <div className="w-full md:w-1/2">
            <DeckDetails deckName={currentCard.cardName} deckDescription={currentCard.cardDescription} />
          </div>
          {/* Pass currentRating and onRatingChange to ActionButtons */}
          {cards.length > 0 && (
            <ActionButtons 
              deckId={currentCard.id} 
              currentRating={currentCard.rating?.userrating || 0} // Extract rating
              onRatingChange={handleRatingUpdate} // Pass the handler
            />
          )}
        </div>
        
        // Image Grid Section (Restored Layout, using DeckImageCard)
        <div className="flex-1 grid grid-cols-1 gap-2 mt-2">
          {/* Adjusted grid classes for consistent sizing */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
            {imagesToDisplay.map((image) => (
              <LazyLoadWrapper key={image.id} rootMargin="200px" threshold={0.1}>
                {/* Use DeckImageCard here instead of renderImage */}
                <DeckImageCard 
                  image={image} 
                  onClick={handleImageSelect} 
                />
              </LazyLoadWrapper>
            ))}
          </div>
          {/* Navigation Controls (Restored Layout) */}
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
    </div>
  );
};

export default DeckImageSelector;