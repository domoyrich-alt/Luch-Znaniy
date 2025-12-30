import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Phone, Video, Search, ArrowDown } from 'lucide-react';
import { useChatStore } from '../../context/ChatContext';
import { users } from '../../data/mockData';
import { groupMessagesByDate, formatLastSeen } from '../../utils/helpers';
import Avatar from '../Common/Avatar';
import Message from './Message';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = () => {
  const {
    activeChat,
    messages,
    chats,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    setTyping,
  } = useChatStore();

  const [editingMessage, setEditingMessage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const chat = chats.find(c => c.id === activeChat);
  const chatMessages = messages[activeChat] || [];
  const user = users.find(u => u.id === activeChat);

  useEffect(() => {
    if (activeChat) {
      markAsRead(activeChat);
      scrollToBottom();
    }
  }, [activeChat, markAsRead]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.senderId === 'me' || !showScrollButton) {
        scrollToBottom();
      }
    }
  }, [chatMessages.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollButton(isScrolledUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (text) => {
    if (editingMessage) {
      editMessage(activeChat, editingMessage.id, text);
      setEditingMessage(null);
    } else {
      sendMessage(activeChat, text);
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
  };

  const handleDeleteMessage = (messageId) => {
    deleteMessage(activeChat, messageId);
  };

  const handleReply = (message) => {
    // TODO: Implement reply functionality
    console.log('Reply to:', message);
  };

  const handleTyping = (isTyping) => {
    setTyping(activeChat, isTyping);
  };

  if (!activeChat) {
    return (
      <div className="chat-window-empty">
        <div className="chat-window-empty-content">
          <h2>Выберите чат</h2>
          <p>Выберите чат из списка слева, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  const messagesByDate = groupMessagesByDate(chatMessages);

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-window-header-info">
          <Avatar src={chat.avatar} name={chat.name} size="md" online={chat.isOnline} />
          <div className="chat-window-header-text">
            <h3>{chat.name}</h3>
            <p className="chat-window-status">
              {chat.isTyping ? (
                <span className="typing-indicator">печатает...</span>
              ) : chat.isOnline ? (
                'онлайн'
              ) : (
                formatLastSeen(user?.lastSeen)
              )}
            </p>
          </div>
        </div>

        <div className="chat-window-header-actions">
          <button className="chat-window-action" title="Поиск">
            <Search size={20} />
          </button>
          <button className="chat-window-action" title="Позвонить">
            <Phone size={20} />
          </button>
          <button className="chat-window-action" title="Видеозвонок">
            <Video size={20} />
          </button>
          <button className="chat-window-action" title="Меню">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div
        className="chat-window-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {Object.entries(messagesByDate).map(([date, msgs]) => (
          <div key={date} className="message-group">
            <div className="message-date-divider">
              <span>{date}</span>
            </div>
            {msgs.map((message, index) => (
              <Message
                key={message.id}
                message={message}
                previousMessage={index > 0 ? msgs[index - 1] : null}
                user={user}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onReply={handleReply}
              />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button className="scroll-to-bottom" onClick={scrollToBottom}>
          <ArrowDown size={24} />
        </button>
      )}

      <MessageInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
};

export default ChatWindow;
