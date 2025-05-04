// src/features/content_dashboard/components/DeckImageCard.jsx
import { useState, useEffect } from 'react';
import { FiHeart, FiImage } from 'react-icons/fi';

const DeckImageCard = ({ image, onClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  // Initialize error state based on whether it's explicitly a placeholder
  const [hasError, setHasError] = useState(image.isPlaceholder);

  // Reset state if the image URL changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(image.isPlaceholder);
  }, [image.url, image.isPlaceholder]);

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    // Only set loading to false if there wasn't an error already
    if (!hasError) {
      setIsLoading(false);
    }
  };

  // Determine if the card should be clickable
  const isClickable = !image.isPlaceholder && !image.isBaseImage && !hasError;
  const cursorStyle = isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed';

  return (
    <div
      key={image.id}
      className={`relative rounded-lg overflow-hidden aspect-[2/3] bg-gray-200 dark:bg-gray-700 ${cursorStyle}`}
      onClick={isClickable ? () => onClick(image) : undefined}
      onDragStart={(e) => e.preventDefault()} // Prevent drag ghost
      title={hasError ? "Image not available" : (image.title || 'Deck image')}
    >
      {/* Show placeholder if there's an error or it's explicitly a placeholder */} 
      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-800">
          <FiImage size={40} className="mb-2 opacity-50" />
          <span className="text-xs text-center px-2">No Image Available</span>
        </div>
      ) : (
        <>
          {/* Optional: Show a simple loading state while image loads */} 
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              {/* You could add a spinner here if desired */}
            </div>
          )}
          <img
            src={image.url}
            alt={image.title || 'Deck image'}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {/* Add Heart icon if it's the base image and loaded correctly */} 
          {image.isBaseImage && !hasError && (
            <FiHeart
              className="absolute top-2 right-2 text-red-500 fill-current"
              size={20}
              title="Current Base Image"
            />
          )}
        </>
      )}
    </div>
  );
};

export default DeckImageCard;