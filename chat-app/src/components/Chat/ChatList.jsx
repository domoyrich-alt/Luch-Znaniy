import React from 'react';
import { useChatStore } from '../../context/ChatContext';
import ChatItem from './ChatItem';
import SearchBar from '../Common/SearchBar';
import ThemeToggle from '../Common/ThemeToggle';
import { Menu } from 'lucide-react';
import './ChatList.css';

const ChatList = () => {
  const {
    activeChat,
    setActiveChat,
    searchQuery,
    setSearchQuery,
    getFilteredChats,
  } = useChatStore();

  const chats = getFilteredChats();

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <button className="menu-button">
          <Menu size={24} />
        </button>
        <div className="chat-list-search">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Поиск чатов..."
          />
        </div>
        <ThemeToggle />
      </div>

      <div className="chat-list-content">
        {chats.length === 0 ? (
          <div className="chat-list-empty">
            <p>Чаты не найдены</p>
          </div>
        ) : (
          chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChat}
              onClick={setActiveChat}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
