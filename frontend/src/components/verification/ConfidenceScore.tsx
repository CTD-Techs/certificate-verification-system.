import React from 'react';

interface ConfidenceScoreProps {
  score: number; // 0 to 100 (percentage)
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  // Handle both 0-1 and 0-100 ranges
  const normalizedScore = score > 1 ? score : score * 100;
  const percentage = Math.round(normalizedScore);
  
  const getColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarColor = () => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-24',
          bar: 'h-1',
          text: 'text-xs',
        };
      case 'lg':
        return {
          container: 'w-64',
          bar: 'h-4',
          text: 'text-lg',
        };
      default:
        return {
          container: 'w-48',
          bar: 'h-2',
          text: 'text-sm',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`font-medium text-gray-700 ${sizeClasses.text}`}>
            Confidence Score
          </span>
          <span className={`font-bold ${getColor()} ${sizeClasses.text}`}>
            {percentage}%
          </span>
        </div>
      )}
      <div className={`${sizeClasses.container}`}>
        <div className={`w-full bg-gray-200 rounded-full ${sizeClasses.bar}`}>
          <div
            className={`${getBarColor()} ${sizeClasses.bar} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};