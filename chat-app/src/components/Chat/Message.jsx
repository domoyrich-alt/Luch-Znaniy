import React, { useState } from 'react';
import { Check, CheckCheck, MoreVertical } from 'lucide-react';
import { formatMessageTime, shouldGroupMessages } from '../../utils/helpers';
import Avatar from '../Common/Avatar';
import MessageContextMenu from './MessageContextMenu';
import './Message.css';

const Message = ({ message, previousMessage, user, onEdit, onDelete, onReply }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const isOwn = message.senderId === 'me';
  const isGrouped = shouldGroupMessages(message, previousMessage);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const renderStatus = () => {
    if (!isOwn) return null;

    if (message.status === 'sent') {
      return <Check size={16} className="message-status" />;
    } else if (message.status === 'delivered') {
      return <CheckCheck size={16} className="message-status" />;
    } else if (message.status === 'read') {
      return <CheckCheck size={16} className="message-status message-status-read" />;
    }
  };

  return (
    <>
      <div
        className={`message ${isOwn ? 'message-own' : 'message-other'} ${
          isGrouped ? 'message-grouped' : ''
        } animate-message-in`}
        onContextMenu={handleContextMenu}
      >
        {!isOwn && !isGrouped && (
          <Avatar src={user?.avatar} name={user?.name} size="sm" className="message-avatar" />
        )}

        <div className="message-content-wrapper">
          {!isOwn && !isGrouped && (
            <div className="message-sender-name">{user?.name}</div>
          )}
          
          <div className={`message-bubble ${isOwn ? 'message-bubble-own' : 'message-bubble-other'}`}>
            <div className="message-text">{message.text}</div>
            <div className="message-meta">
              <span className="message-time">{formatMessageTime(message.timestamp)}</span>
              {message.edited && <span className="message-edited">изменено</span>}
              {renderStatus()}
            </div>
          </div>
        </div>

        <button
          className="message-more"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPosition({ x: rect.right, y: rect.bottom });
            setShowMenu(true);
          }}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {showMenu && (
        <MessageContextMenu
          message={message}
          isOwn={isOwn}
          position={menuPosition}
          onClose={() => setShowMenu(false)}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
        />
      )}
    </>
  );
};

export default Message;
