import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
// import { useSwipeable } from 'react-swipeable'; // Remove swipe handlers
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'; // Import Card components
import { FiHeart, FiArrowLeft, FiArrowRight } from 'react-icons/fi'; // Import icons
import './ImageSelectorPage.css'; // Import CSS for animations
import DeckDetails from '../components/DeckDetails'; // Import DeckDetails
import CardDetails from '../components/CardDetails'; // Import CardDetails

const ImageSelectorPage = ({ supabase, session }) => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

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
  const deckName = location.state?.deckName || `Deck ID: ${deckId}`;
  const deckDescription = location.state?.deckDescription || '';
  console.log('Navigation state:', location.state); // Debug log to verify state

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: cardData, error: cardError } = await supabase
          .from('cards')
          .select('id, title_key, description_key, asset_url, deck_id')
          .eq('status', 'choosebaseimage')
          .eq('deck_id', deckId);

        if (cardError) throw cardError;
        if (!cardData || cardData.length === 0) {
          setCards([]);
          setLoading(false);
          return;
        }

        const titleKeys = cardData.map(card => card.title_key).filter(Boolean);
        const descriptionKeys = cardData.map(card => card.description_key).filter(Boolean);
        let translationMap = {};
        
        // Fetch translations for both title and description keys
        const allKeys = [...titleKeys, ...descriptionKeys].filter(Boolean);
        if (allKeys.length > 0) {
          const { data: translations, error: translationsError } = await supabase
            .from('translations_en')
            .select('key, value')
            .in('key', allKeys);
          if (translationsError) throw translationsError;
          translationMap = translations.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
          }, {});
        }

        const cardsWithImages = cardData.map(card => {
          let assetData = {};
          try {
            assetData = typeof card.asset_url === 'string' ? JSON.parse(card.asset_url) : (card.asset_url || {});
          } catch (parseError) {
            console.error('Error parsing asset_url:', parseError, card.asset_url);
            assetData = {};
          }

          const images = Object.entries(assetData)
            .filter(([key, url]) => url && typeof url === 'string' && key !== 'selected') // Exclude 'selected' key if present
            .map(([key, url]) => ({
              id: key,
              url,
              title: key
            }));

          return {
            ...card,
            images: images,
            cardName: card.title_key ? (translationMap[card.title_key] || `Key: ${card.title_key}`) : `ID: ${card.id}`,
            cardDescription: card.description_key ? (translationMap[card.description_key] || `Key: ${card.description_key}`) : ''
          };
        });

        setCards(cardsWithImages);
      } catch (error) {
        console.error('Error fetching cards:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (deckId) {
        fetchCards();
    }
  }, [supabase, deckId]);

  const handleImageSelect = (image) => {
    if (!cards[currentIndex]) return;
    setSelectedImage(image);
};

const handleDeselectImage = () => {
    setSelectedImage(null);
};

const handlePrevious = () => {
    if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setSelectedImage(null); // Deselect image when changing card
    }
};

const handleNext = () => {
    if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedImage(null); // Deselect image when changing card
    }
};

// Remove Backdrop as selection is now in-place
// const Backdrop = ({ onClick }) => (
//   <div 
//     className="fixed inset-0 bg-black bg-opacity-50 z-40"
//     onClick={onClick}
//   />
// );

const pulseAnimation = {
  '0%': { transform: 'scale(1)', color: 'white' },
  '50%': { transform: 'scale(1.3)', color: 'red' },
  '100%': { transform: 'scale(1)', color: 'white' }
};

// Define styles for selected image
const selectedImageStyle = "border-4 border-blue-500 ring-2 ring-blue-300 scale-105 transition-transform duration-200 ease-in-out";

const handleConfirmSelection = async () => {
    if (!selectedImage || !cards[currentIndex]) return;
    
    setLoading(true);
    setError(null);
    try {
      const currentCard = cards[currentIndex];
      // Fetch existing asset_url data to preserve non-image keys if necessary
      const { data: currentCardData, error: fetchError } = await supabase
        .from('cards')
        .select('asset_url')
        .eq('id', currentCard.id)
        .single();

      if (fetchError) throw fetchError;

      let existingAssetData = {};
      try {
        existingAssetData = typeof currentCardData.asset_url === 'string' ? JSON.parse(currentCardData.asset_url) : (currentCardData.asset_url || {});
      } catch (parseError) {
        console.error('Error parsing existing asset_url:', parseError, currentCardData.asset_url);
        existingAssetData = {};
      }

      // Construct the updated asset_url with baseimage for selected and rejectedbasimage for others
      const updatedAssetData = {
        ...existingAssetData, // Keep existing non-image data
        baseimage: selectedImage.url,
      };

      // Add rejected images dynamically
      let rejectedIndex = 1;
      currentCard.images.forEach(img => {
        if (img.id !== selectedImage.id) {
          const key = `rejectedbasimage${String(rejectedIndex).padStart(2, '0')}`;
          updatedAssetData[key] = img.url;
          rejectedIndex++;
        }
      });

      // Filter out null/undefined values before stringifying (optional, but good practice)
      const filteredAssetData = Object.entries(updatedAssetData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const updatedAssetUrl = JSON.stringify(filteredAssetData);

      const { error: updateError } = await supabase
        .from('cards')
        .update({
          status: 'image_selected',
          asset_url: updatedAssetUrl
        })
        .eq('id', currentCard.id);

      if (updateError) throw updateError;

      setSelectedImage(null);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        console.log('Finished selecting images for this deck!');
        setCurrentIndex(cards.length);
      }
    } catch (error) {
      console.error('Error updating card:', error);
      setError(`Failed to update card: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Remove Basic Navigation and Swipe Handlers
  // const handlePrev = () => { ... };
  // const handleNext = () => { ... };
  // const handlers = useSwipeable({ ... });

  const currentCard = cards[currentIndex]; // Get current card for easier access

  // Handle clicking outside the image grid to deselect
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the image grid container and not on the confirm button
      const grid = document.getElementById('image-grid-container');
      const confirmButton = document.getElementById('confirm-selection-button');
      if (grid && !grid.contains(event.target) && (!confirmButton || !confirmButton.contains(event.target))) {
        handleDeselectImage();
      }
    };

    if (selectedImage) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedImage]); // Re-run when selectedImage changes

  // --- Render Logic --- 
  return (
    <div className="image-selector-container p-4">
      {/* Container for Deck and Card Details */}
      <div className="flex w-full justify-between space-x-4 mb-4">
        <div className="flex-1">
          <DeckDetails deckName={deckName} deckDescription={deckDescription} />
        </div>
        <div className="flex-1">
          <CardDetails cardName={currentCard?.cardName} cardDescription={currentCard?.cardDescription} />
        </div>
      </div>

      {/* Existing loading/error/content rendering logic */}
      {loading ? (
        <div className="flex items-center justify-center h-screen bg-[#121417]">
          <p>Loading cards...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen bg-[#121417]">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex items-center justify-center h-screen bg-[#121417]">
          <p>No images found for this deck matching the criteria.</p>
        </div>
      ) : currentIndex >= cards.length ? (
        <div className="flex items-center justify-center h-screen bg-[#121417]">
          <p>Finished selecting images for this deck!</p>
        </div>
      ) : (
        <div className="w-full">
          {/* Image Grid Container */}
          <div id="image-grid-container" className="w-full">
            {/* Image Grid */}
          <div className="image-grid mb-4">
            {currentCard.images.map((image) => (
              <div
                key={image.id}
                className={`relative aspect-w-1 aspect-h-1 cursor-pointer group rounded-lg overflow-hidden ${selectedImage?.id === image.id ? selectedImageStyle : 'border-2 border-transparent hover:border-gray-400'}`}
                onClick={() => handleImageSelect(image)} // Add onClick here
              >
                <img
                  src={image.url}
                  alt={image.title || `Image ${image.id}`}
                  className="object-cover w-full h-full shadow-md group-hover:opacity-80 transition-opacity"
                />
                {/* Add overlay/icon for selected state */}
                {selectedImage?.id === image.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-200">
                    <FiHeart className="text-white text-4xl opacity-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          </div>
          {/* Navigation Buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiArrowLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= cards.length - 1}
              className={`p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${currentIndex >= cards.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiArrowRight size={24} />
            </button>
          </div>

          {/* Add Confirm/Cancel Buttons conditionally */}
          {selectedImage && (
            <div className="mt-6 flex justify-center space-x-4">
              <button 
                id="confirm-selection-button"
                onClick={handleConfirmSelection} 
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                <FiHeart />
                <span>{loading ? 'Confirming...' : 'Confirm Selection'}</span>
              </button>
              <button 
                onClick={handleDeselectImage} 
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageSelectorPage;