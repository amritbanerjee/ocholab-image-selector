import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable'; // Keep swipe for potential future use

const ImageSelectorPage = ({ supabase, session }) => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { deckId } = useParams();
  const location = useLocation();
  // Attempt to get deckName from location state, fallback if needed
  const deckName = location.state?.deckName || `Deck ID: ${deckId}`; 

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null); // Reset error on new fetch
      try {
        // Fetch cards for this deck needing image selection
        const { data: cardData, error: cardError } = await supabase
          .from('cards')
          .select('id, title_key, asset_url, deck_id') // Select only necessary fields
          .eq('status', 'choosebaseimage')
          .eq('deck_id', deckId);

        if (cardError) throw cardError;
        if (!cardData || cardData.length === 0) {
          setCards([]); // Set empty cards if none found
          setLoading(false);
          return;
        }

        // Get all title_keys for translation fetching
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

        // Process cards with images and translations
        const cardsWithImages = cardData.map(card => {
          let assetData = {};
          try {
            // Ensure asset_url is parsed correctly
            assetData = typeof card.asset_url === 'string' ? JSON.parse(card.asset_url) : (card.asset_url || {});
          } catch (parseError) {
            console.error('Error parsing asset_url:', parseError, card.asset_url);
            assetData = {}; // Default to empty if parsing fails
          }
          
          // Filter out potential non-image entries if necessary, map to expected structure
          const images = Object.entries(assetData)
            .filter(([key, url]) => url && typeof url === 'string') // Basic validation
            .map(([key, url]) => ({
              id: key, // Use the key from assetData as id
              url,
              title: key // Use the key as title for now
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

  // --- Image Selection Handler --- 
  const handleImageSelect = async (selectedImage) => {
    if (!cards[currentIndex]) return; // Guard against index out of bounds

    setLoading(true); // Indicate processing
    setError(null);
    try {
      const currentCard = cards[currentIndex];
      const currentImages = currentCard.images.reduce((acc, img) => ({ ...acc, [img.id]: img.url }), {});
      
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          status: 'imagechosen', // Update status
          selected_image: selectedImage.url, // Store the selected image URL
          asset_url: JSON.stringify({ // Update asset_url, keeping existing images and marking selected
            selected: selectedImage.url,
            ...currentImages 
          })
        })
        .eq('id', currentCard.id);

      if (updateError) throw updateError;

      // Move to the next card if successful and not the last card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Optional: Handle completion (e.g., show message, navigate)
        console.log('Finished selecting images for this deck!');
        // Maybe set a state to show completion message instead of just logging
        // Or navigate back to the deck list: navigate('/decks'); (need useNavigate hook)
        // For now, just stay on the page showing the last card's completion state
        // We might need a different state for 'completed' vs 'no cards'
      }
    } catch (error) {
      console.error('Error updating card:', error);
      setError(`Failed to update card: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Basic Navigation --- 
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  // --- Swipe Handlers (optional but kept for now) ---
  const handlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // --- Render Logic --- 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          Error loading images: {error}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-sm text-gray-700 bg-gray-100 rounded-lg" role="alert">
          No images available for selection in this deck.
        </div>
      </div>
    );
  }

  // Ensure currentIndex is valid after data load or card selection
  if (currentIndex >= cards.length && cards.length > 0) {
     // This case might happen if the last card was just processed
     // For now, just show a completion message, or navigate away
     return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
          All images reviewed for this deck!
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  // Basic structure - will be refined into two panels later
  return (
    // Using flex-grow to fill available space in a potential flex container (like HomePage)
    <div className="flex flex-col items-center justify-start flex-grow p-4 pt-6" {...handlers}>
      {/* Header Section */}
      <div className="w-full max-w-4xl mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
          <h1 className="text-xl font-semibold text-gray-800">{deckName} - Image Selection</h1>
          <span className="text-md text-gray-600 font-medium mt-1 md:mt-0">{card.cardName} (Card {currentIndex + 1} of {cards.length})</span>
        </div>
      </div>

      {/* Image Display Area (Simulating the Right Panel) */}
      <div className="w-full max-w-4xl flex items-center justify-center space-x-4">
        {/* Prev Button */}
        <button 
          onClick={handlePrev} 
          className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={cards.length <= 1}
          aria-label="Previous Card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-4 flex-grow" style={{ maxWidth: '800px' }}> {/* Adjust grid/max-width as needed */}
          {card.images && card.images.length > 0 ? (
            card.images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-[3/4] bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-400 transition duration-150 ease-in-out"
                onClick={() => handleImageSelect(image)}
                tabIndex={0} // Make it focusable
                onKeyPress={(e) => e.key === 'Enter' && handleImageSelect(image)} // Allow selection with Enter key
              >
                <img src={image.url} alt={image.title || 'Candidate image'} className="w-full h-full object-contain p-1" />
                {/* Optional: Overlay with title if needed */}
                {/* <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <h2 className="text-sm font-semibold text-white truncate">{image.title || image.id}</h2>
                </div> */}
              </div>
            ))
          ) : (
            <div className="col-span-2 flex items-center justify-center h-64 text-gray-500">
              No images found for this card.
            </div>
          )}
        </div>

        {/* Next Button */}
        <button 
          onClick={handleNext} 
          className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={cards.length <= 1}
          aria-label="Next Card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Optional: Add swipe hint or other controls if needed */}
      {/* <div className="mt-4 text-gray-500 text-sm">
        Swipe left/right or use buttons to navigate cards. Click an image to select it.
      </div> */}
    </div>
  );
};

export default ImageSelectorPage;