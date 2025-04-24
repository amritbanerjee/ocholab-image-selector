import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
// import { useSwipeable } from 'react-swipeable'; // Remove swipe handlers
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'; // Import Card components
import { FiHeart } from 'react-icons/fi'; // Import Heart icon
import './ImageSelectorPage.css'; // Import CSS for animations

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

  // --- Render Logic --- 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121417]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121417]">
        <div className="p-4 text-sm text-red-300 bg-red-900/50 rounded-lg" role="alert">
          Error loading images: {error}
        </div>
      </div>
    );
  }

  // Handle case where all cards have been processed (currentIndex is out of bounds)
  if (currentIndex >= cards.length) {
     return (
      <div className="flex items-center justify-center h-screen bg-[#121417]">
        <div className="p-4 text-sm text-green-300 bg-green-900/50 rounded-lg" role="alert">
          All images reviewed for this deck!
        </div>
      </div>
    );
  }

  // Handle case where there were no cards to begin with
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121417]">
        <div className="p-4 text-sm text-gray-400 bg-gray-800 rounded-lg" role="alert">
          No images available for selection in this deck.
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="flex flex-col items-center justify-start flex-grow p-4 pt-6 bg-[#121417] min-h-screen text-white">
      {/* Confirm Button - Only shows when an image is selected */}
      {selectedImage && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-20 animate-bounce">
          <button 
            onClick={handleConfirmSelection}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full shadow-lg transition-colors"
          >
            Confirm Selection
          </button>
        </div>
      )}
      
      {/* Main Content Area with Cards */}
      <div className="w-full max-w-6xl px-4 grid grid-cols-12 gap-6 min-h-[500px]"> {/* Removed h-[80vh] */}
        {/* Deck Info Card */}
        <Card className="bg-[#1f2328] border border-gray-700 text-white shadow-md rounded-lg overflow-hidden col-span-3 h-full flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            <div className="mb-4">
            <h1 className="text-2xl font-bold">{deckName}</h1>
            {deckDescription && (
              <p className="text-sm text-gray-400 mt-1">{deckDescription}</p>
            )}
          </div>
            <p className="text-lg text-gray-400">Select the best image for: <span className="font-semibold text-gray-200">{card.cardName}</span></p>
            {card.cardDescription && <p className="text-sm text-gray-400 mt-2">{card.cardDescription}</p>}
            <p className="text-sm text-gray-500 mt-2">(Card {currentIndex + 1} of {cards.length})</p>
          </CardContent>
        </Card>
        {/* Image Selection Grid */}
        {/* Removed redundant outer div, kept inner div with items-start */}
        <div className="col-span-9 items-start"> 
            <div className="grid grid-cols-2 gap-4 w-full"> 
              {card.images.slice(0, 4).map((image, idx) => (
                <button
                key={image.id}
                className={`relative w-full bg-[#23272f] rounded-2xl overflow-hidden border transition-all duration-300 group aspect-[3/4] ${
                  selectedImage?.id === image.id 
                    ? 'border-blue-500 scale-110 z-10 shadow-xl' 
                    : 'border-gray-700 hover:border-blue-400 hover:scale-102'
                }`}
                onClick={() => handleImageSelect(image)}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    selectedImage?.id === image.id ? 'scale-110' : ''
                  }`}
                />
                
                {/* Heart icon overlay - initially hidden, appears on hover/focus */}
                <div className={`absolute top-2 right-2 transition-opacity ${selectedImage?.id === image.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'}`}>
                  <FiHeart 
  className={`w-8 h-8 cursor-pointer ${selectedImage?.id === image.id ? 'text-red-500 fill-red-500 animate-pulse' : 'text-white hover:text-red-500'}`} 
  style={selectedImage?.id === image.id ? {
    animation: 'pulse 1s infinite',
    color: 'red'
  } : {}}
/>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectorPage;