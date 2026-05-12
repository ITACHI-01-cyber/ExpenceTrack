import React from 'react';

const SkeletonCard = ({ className = "" }) => {
  return (
    <div className={`bg-white rounded-card shadow-card p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-background rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-background rounded w-1/2 mb-6"></div>
      <div className="space-y-3">
        <div className="h-2 bg-background rounded"></div>
        <div className="h-2 bg-background rounded w-5/6"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
