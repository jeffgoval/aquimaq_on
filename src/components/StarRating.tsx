import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  count = 0, 
  size = 14, 
  showCount = true 
}) => {
  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= Math.round(rating) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'fill-gray-100 text-gray-300'
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-gray-500 ml-1">
          ({count})
        </span>
      )}
    </div>
  );
};

export default StarRating;