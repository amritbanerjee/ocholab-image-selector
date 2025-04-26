import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable'; // Add swipe handlers
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
  
  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrevious(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
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
          .select('id, title_key, description_key, asset_url, deck_id, status')
          .or('status.eq.choosebaseimage,status.eq.imagecreated')
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

          // Check for existing baseimage and rejected images
          const hasBaseImage = assetData.baseimage && typeof assetData.baseimage === 'string';
          const isImageCreated = card.status === 'imagecreated';
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
    if (!cards[currentIndex] || image.isRejected || image.isBaseImage) return;
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

const CardCounter = () => (
  <div className="flex items-center justify-center mx-4 text-gray-600 font-medium">
    {cards.length > 0 ? `${currentIndex + 1} of ${cards.length}` : '0 of 0'}
  </div>
);

const pulseAnimation = {
  '0%': { transform: 'scale(1)', color: 'red' },
  '50%': { transform: 'scale(1.3)', color: 'red' },
  '100%': { transform: 'scale(1)', color: 'red' }
};

const renderImage = (image) => {
  const style = image.isBaseImage ? baseImageStyle : 
                image.isRejected ? rejectedImageStyle : 
                selectedImage?.id === image.id ? selectedImageStyle : '';
  
  return (
    <div key={image.id} className={`relative rounded-lg overflow-hidden ${style}`}>
      {image.isImageCreated && (
        <div className="absolute top-2 right-2 z-10">
          <FiHeart className="text-red-500 text-2xl" />
        </div>
      )}
      <img 
        src={image.url} 
        alt={image.title} 
        className="w-full h-full object-cover"
        onClick={() => handleImageSelect(image)}
      />
      {(image.isBaseImage || selectedImage?.id === image.id) && (
        <div className={heartStyle}>
          <FiHeart className="fill-current" size={24} />
        </div>
      )}
    </div>
  );
};

// Define styles for selected image
const selectedImageStyle = "border-4 border-blue-500 ring-2 ring-blue-300 scale-110 transition-transform duration-200 ease-in-out";
const heartStyle = "absolute top-2 right-2 text-red-500 z-10";
const baseImageStyle = "border-4 border-green-500 ring-2 ring-green-300";
const rejectedImageStyle = "opacity-50 border-4 border-red-500 ring-2 ring-red-300";

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

      // Add rejected images dynamically by excluding the selected image
      const rejectedImages = currentCard.images.filter(img => img.id !== selectedImage.id);
      rejectedImages.forEach((img, index) => {
        const key = `rejectedbasimage${String(index + 1).padStart(2, '0')}`;
        updatedAssetData[key] = img.url;
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
    <div className="image-selector-container p-4" {...swipeHandlers}>
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
                  className="object-cover w-full h-full shadow-md group-hover:opacity-80 transition-opacity relative"
                />
                {/* Add overlay/icon for selected state */}
                {selectedImage?.id === image.id && (
                  <FiHeart className={`animate-pulse ${heartStyle}`} style={{...pulseAnimation}} size={48} />
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
            <CardCounter />
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
            <div className="mt-6 flex justify-center space-x-4 fixed bottom-8 left-0 right-0 z-50 animate-fade-in">
              <button 
                id="confirm-selection-button"
                onClick={handleConfirmSelection} 
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2 transition-all duration-300 shadow-lg disabled:opacity-50"
                disabled={loading}
              >
                <FiHeart className="animate-pulse" />
                <span className="font-medium">{loading ? 'Confirming...' : 'Confirm Selection'}</span>
              </button>
              <button 
                onClick={handleDeselectImage} 
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg disabled:opacity-50"
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