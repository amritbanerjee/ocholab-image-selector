import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
// import { useSwipeable } from 'react-swipeable'; // Remove swipe handlers
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'; // Import Card components
import { FiHeart } from 'react-icons/fi'; // Import Heart icon
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

  const handleImageSelect = async (selectedImage) => {
    if (!cards[currentIndex]) return;
    
    setSelectedImage(selectedImage);
};

const handleDeselectImage = () => {
    setSelectedImage(null);
};

const Backdrop = ({ onClick }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 z-40"
    onClick={onClick}
  />
);

const pulseAnimation = {
  '0%': { transform: 'scale(1)', color: 'white' },
  '50%': { transform: 'scale(1.3)', color: 'red' },
  '100%': { transform: 'scale(1)', color: 'white' }
};

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
        ...existingAssetData,
        baseimage: selectedImage.url,
        rejectedbasimage01: card.images[0]?.url,
        rejectedbasimage02: card.images[1]?.url,
        rejectedbasimage03: card.images[2]?.url
      };
      
      const updatedAssetUrl = JSON.stringify(updatedAssetData);

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
          {/* Image Grid */}
          <div className="image-grid mb-4">
            {currentCard.images.map((image) => (
              <div
                key={image.id}
                className={`image-item ${selectedImage?.id === image.id ? 'selected-image' : ''}`}
                onClick={() => handleImageSelect(image)}
              >
                <img src={image.url} alt={image.title || `Image ${image.id}`} className="w-full h-auto object-cover rounded" />
              </div>
            ))}
          </div>

          {/* Selected Image Modal */}
          {selectedImage && (
            <>
              <Backdrop onClick={handleDeselectImage} />
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <Card className="relative w-full max-w-lg bg-card text-card-foreground shadow-lg rounded-lg">
                  <CardHeader>
                    <CardTitle>Confirm Selection</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <img src={selectedImage.url} alt="Selected image" className="max-w-full max-h-96 object-contain rounded mb-4" />
                    <p className="mb-4">Select this image as the base image for "{currentCard.cardName}"?</p>
                    <div className="flex space-x-4">
                      <button 
                        onClick={handleConfirmSelection} 
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2"
                      >
                        <FiHeart className="heart-icon" />
                        <span>Confirm</span>
                      </button>
                      <button 
                        onClick={handleDeselectImage} 
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageSelectorPage;