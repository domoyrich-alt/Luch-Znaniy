import React from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ value, onChange, onClear, placeholder = 'Поиск...', autoFocus = false }) => {
  return (
    <div className="search-bar">
      <Search className="search-icon" size={20} />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      {value && (
        <button className="search-clear" onClick={onClear}>
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
