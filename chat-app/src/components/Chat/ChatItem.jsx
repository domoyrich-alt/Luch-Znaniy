import React from 'react';
import { Pin } from 'lucide-react';
import Avatar from '../Common/Avatar';
import Badge from '../Common/Badge';
import { formatChatTime } from '../../utils/helpers';
import './ChatItem.css';

const ChatItem = ({ chat, isActive, onClick }) => {
  const handleClick = () => {
    onClick(chat.id);
  };

  return (
    <div
      className={`chat-item ${isActive ? 'chat-item-active' : ''} ripple-effect`}
      onClick={handleClick}
    >
      <Avatar src={chat.avatar} name={chat.name} size="md" online={chat.isOnline} />
      
      <div className="chat-item-content">
        <div className="chat-item-header">
          <div className="chat-item-name">
            {chat.isPinned && <Pin size={14} className="chat-item-pin" />}
            <span>{chat.name}</span>
          </div>
          <div className="chat-item-time">
            {formatChatTime(chat.lastMessageTime)}
          </div>
        </div>
        
        <div className="chat-item-footer">
          <div className="chat-item-message">
            {chat.isTyping ? (
              <span className="chat-item-typing">печатает...</span>
            ) : (
              <span>{chat.lastMessage}</span>
            )}
          </div>
          {chat.unreadCount > 0 && <Badge count={chat.unreadCount} />}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;
