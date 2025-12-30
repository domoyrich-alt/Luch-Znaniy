import React from 'react';
import './Avatar.css';
import { getInitials } from '../../utils/helpers';

const Avatar = ({ src, name, size = 'md', online = false, className = '' }) => {
  const sizeClass = `avatar-${size}`;

  return (
    <div className={`avatar ${sizeClass} ${className}`}>
      {src ? (
        <div className="avatar-emoji">{src}</div>
      ) : (
        <div className="avatar-initials">{getInitials(name)}</div>
      )}
      {online && <div className="avatar-online-indicator" />}
    </div>
  );
};

export default Avatar;
