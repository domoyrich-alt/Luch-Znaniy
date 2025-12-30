import React from 'react';
import './Badge.css';

const Badge = ({ count, className = '' }) => {
  if (!count || count === 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <div className={`badge ${className}`}>
      {displayCount}
    </div>
  );
};

export default Badge;
