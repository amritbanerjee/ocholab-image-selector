// Import necessary React hooks and libraries
import { useState, useEffect } from 'react';
// Import routing utilities for navigation and URL parameters
import { useParams, useLocation, useNavigate } from 'react-router-dom';
// Import swipe handlers for touch/mouse swipe gestures
import { useSwipeable } from 'react-swipeable';
// Import UI components for card layout
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
// Import icons for navigation buttons
import { FiHeart, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
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

          // Check for existing baseimage and rejected images
          const hasBaseImage = assetData.baseimage && typeof assetData.baseimage === 'string';
          const isImageCreated = deck.status === 'imagecreated';
          const rejectedImages = Object.entries(assetData)
            .filter(([key, url]) => 
              url && typeof url === 'string' && 
              key.startsWith('rejectedbasimage') && 
              key !== 'selected'
            )
            .map(([key, url]) => ({
              id: key,
              url,
              title: key,
              isRejected: true,
              isImageCreated: isImageCreated
            }));

          const images = Object.entries(assetData)
            .filter(([key, url]) => 
              url && typeof url === 'string' && 
              !key.startsWith('rejectedbasimage') && 
              key !== 'selected' && 
              key !== 'baseimage'
            )
            .map(([key, url]) => ({
              id: key,
              url,
              title: key,
              isBaseImage: hasBaseImage && key === 'baseimage'
            }));

          // Combine all images with baseimage first if exists
          const allImages = [];
          if (hasBaseImage) {
            allImages.push({
              id: 'baseimage',
              url: assetData.baseimage,
              title: 'baseimage',
              isBaseImage: true,
              isImageCreated: isImageCreated
            });
          }
          allImages.push(...images.map(img => ({
            ...img,
            isImageCreated: isImageCreated
          })), ...rejectedImages);

          return {
            ...deck,
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
    if (!cards[currentIndex] || image.isRejected || image.isBaseImage) return;
    
    setSelectedImage({
      ...image,
      style: { transform: 'scale(1.15)' }
    });
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

const handlePrevious = () => {
    if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        setSelectedImage(null); // Deselect image when changing card
        navigate(`/deck/${deckId}/deckimages?index=${newIndex}`, { replace: true });
    }
};

const handleNext = () => {
    if (currentIndex < cards.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        setSelectedImage(null); // Deselect image when changing card
        navigate(`/deck/${deckId}/deckimages?index=${newIndex}`, { replace: true });
    }
};

const CardCounter = () => (
  <div className="flex items-center justify-center mx-4 text-gray-600 font-medium">
    {cards.length > 0 ? `${currentIndex + 1} of ${cards.length}` : '0 of 0'}
  </div>
);

const ActionButtons = ({ deckId }) => (
  <div className="flex space-x-2 ml-4">
    <button 
      onClick={() => handleRejectTopic(deckId)}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
    >
      Reject Topic
    </button>
    <button 
      onClick={() => handleRecreatePromptAndImage(deckId)}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Recreate Prompt
    </button>
    <button 
      onClick={() => handleRecreateImage(deckId)}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
    >
      Recreate Image
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
                image.isRejected ? 'opacity-50' : 
                selectedImage?.id === image.id ? 'border-3 border-blue-500' : '';
  
  return (
    <div key={image.id} className={`relative rounded-lg overflow-hidden ${style}`}>
      <img 
        src={image.url} 
        alt={image.title} 
        className={`w-full h-full object-cover ${selectedImage?.id === image.id ? 'scale-110 transition-transform duration-300' : ''}`}
        onClick={() => handleImageSelect(image)}
      />
      {selectedImage?.id === image.id && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 flex justify-center space-x-4">
          <button 
            className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();
              handleDeselectImage();
            }}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={(e) => {
              e.stopPropagation();
              handleConfirmSelection(image, cards[currentIndex].id)
            }}
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
};

return (
  <div className="container mx-auto px-4 py-2">
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