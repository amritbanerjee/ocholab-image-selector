import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
// import { useSwipeable } from 'react-swipeable'; // Remove swipe handlers
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'; // Import Card components
import { FiHeart } from 'react-icons/fi'; // Import Heart icon

const ImageSelectorPage = ({ supabase, session }) => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { deckId } = useParams();
  const location = useLocation();
  const deckName = location.state?.deckName || `Deck ID: ${deckId}`;

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: cardData, error: cardError } = await supabase
          .from('cards')
          .select('id, title_key, asset_url, deck_id')
          .eq('status', 'choosebaseimage')
          .eq('deck_id', deckId);

        if (cardError) throw cardError;
        if (!cardData || cardData.length === 0) {
          setCards([]);
          setLoading(false);
          return;
        }

        const titleKeys = cardData.map(card => card.title_key).filter(Boolean);
        let translationMap = {};
        if (titleKeys.length > 0) {
          const { data: translations, error: translationsError } = await supabase
            .from('translations_en')
            .select('key, value')
            .in('key', titleKeys);
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
            cardName: card.title_key ? (translationMap[card.title_key] || `Key: ${card.title_key}`) : `ID: ${card.id}`
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
        // Decide how to handle parse error - maybe proceed with empty object or throw?
        existingAssetData = {};
      }

      // Construct the updated asset_url, preserving other keys
      const updatedAssetUrl = JSON.stringify({
        ...existingAssetData, // Keep existing data
        selected: selectedImage.url, // Add/update the selected image URL
      });

      const { error: updateError } = await supabase
        .from('cards')
        .update({
          status: 'imagechosen',
          selected_image: selectedImage.url,
          asset_url: updatedAssetUrl
        })
        .eq('id', currentCard.id);

      if (updateError) throw updateError;

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        console.log('Finished selecting images for this deck!');
        // Consider navigating away or showing a persistent completion message
        // For now, we might fall through to the 'All images reviewed' state below
        // To ensure it shows, we can manually set the index beyond the bounds
        setCurrentIndex(cards.length); // Move index past the end
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
    // Use dark background matching HomePage
    <div className="flex flex-col items-center justify-start flex-grow p-4 pt-6 bg-[#121417] min-h-screen text-white">
      {/* Header Section - Simplified */} 
      <div className="w-full max-w-6xl mb-6 text-center">
        <h1 className="text-2xl font-bold mb-1">{deckName}</h1>
        <p className="text-lg text-gray-400">Select the best image for: <span className="font-semibold text-gray-200">{card.cardName}</span></p>
        <p className="text-sm text-gray-500">(Card {currentIndex + 1} of {cards.length})</p>
      </div>

      {/* Image Display Area within a Card-like structure */} 
      <div className="w-full max-w-6xl px-4"> {/* Added padding */} 
        {/* Image Grid */} 
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"> {/* Responsive grid */} 
          {card.images && card.images.length > 0 ? (
            card.images.map((image) => (
              <div
                key={image.id}
                className="relative group bg-[#1f2328] border border-gray-700 rounded-2xl shadow-lg overflow-hidden aspect-[9/16] transition-transform duration-200 ease-in-out hover:scale-105"
                // Removed direct click handler from the container
              >
                <img 
                  src={image.url} 
                  alt={image.title || 'Candidate image'} 
                  className="w-full h-full object-cover" 
                  loading="lazy" // Add lazy loading
                />
                {/* Overlay for Name and Like Button */} 
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <h2 className="text-lg font-semibold text-white truncate mb-2" title={image.title || image.id}>{image.title || image.id}</h2>
                  <button 
                    onClick={() => handleImageSelect(image)}
                    className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm p-3 rounded-full text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition duration-150 ease-in-out"
                    aria-label="Select this image"
                  >
                    <FiHeart size={20} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center h-64 text-gray-500 bg-[#1f2328] border border-gray-700 rounded-2xl">
              No images found for this card.
            </div>
          )}
        </div>
      </div>

      {/* Removed Arrow Buttons and Swipe Hint */} 

    </div>
  );
};

export default ImageSelectorPage;