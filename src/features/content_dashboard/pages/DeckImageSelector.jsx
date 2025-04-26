import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable'; // Add swipe handlers
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'; // Import Card components
import { FiHeart, FiArrowLeft, FiArrowRight } from 'react-icons/fi'; // Import icons
import './ImageSelectorPage.css'; // Import CSS for animations
import DeckDetails from '../components/DeckDetails'; // Import DeckDetails
import CardDetails from '../components/CardDetails'; // Import CardDetails

const DeckImageSelector = ({ supabase, session }) => {
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
  return (
    <div key={image.id} className="relative">
      <img 
        src={image.url} 
        alt={image.title}
        className={`w-full h-auto rounded-lg ${image.isRejected ? 'opacity-50' : ''}`}
      />
      {!image.isRejected && !image.isBaseImage && (
        <button 
          onClick={() => handleImageSelect(image)}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
        >
          <FiHeart className="text-red-500" />
        </button>
      )}
    </div>
  );
};

return (
  <div className="container mx-auto px-4 py-8">
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
      <div {...swipeHandlers}>
        <div className="flex items-center justify-between mb-4">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards[currentIndex].images.map(renderImage)}
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