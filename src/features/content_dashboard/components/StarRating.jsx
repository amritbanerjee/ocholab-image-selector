import React, { useState } from 'react';
import { FiStar } from 'react-icons/fi';

const StarRating = ({ currentRating = 0, onRatingChange, maxRating = 5 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (rating) => {
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const handleClick = (ratingValue) => {
    console.log('Star clicked:', ratingValue);
    // If the clicked star is the current rating, clear it (send 0)
    // Otherwise, set the new rating
    const newRating = ratingValue === currentRating ? 0 : ratingValue;
    onRatingChange(newRating);
  };

  return (
    <div className="flex items-center space-x-1">
      {[...Array(maxRating)].map((_, index) => {
        const ratingValue = index + 1;
        const isFilled = ratingValue <= (hoverRating || currentRating);

        return (
          <button
            key={ratingValue}
            type="button"
            className={`transition-colors duration-150 ease-in-out 
                        ${isFilled ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`}
            onMouseEnter={() => handleMouseEnter(ratingValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(ratingValue)}
            aria-label={`Rate ${ratingValue} out of ${maxRating}`}
          >
            <FiStar 
              className={`w-5 h-5 ${isFilled ? 'fill-current' : ''}`} 
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;