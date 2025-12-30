import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import './MessageInput.css';

const MessageInput = ({ onSend, onTyping, editingMessage, onCancelEdit }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    // Notify typing
    if (onTyping) {
      onTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!text.trim()) return;

    onSend(text.trim());
    setText('');
    
    if (onTyping) {
      onTyping(false);
    }

    if (editingMessage && onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      {editingMessage && (
        <div className="message-input-editing">
          <span>Редактирование сообщения</span>
          <button onClick={onCancelEdit}>Отмена</button>
        </div>
      )}

      <form className="message-input" onSubmit={handleSubmit}>
        <button
          type="button"
          className="message-input-button"
          title="Прикрепить файл"
        >
          <Paperclip size={22} />
        </button>

        <div className="message-input-field-wrapper">
          <textarea
            ref={inputRef}
            className="message-input-field"
            placeholder="Напишите сообщение..."
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '24px',
              maxHeight: '120px',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
        </div>

        <button
          type="button"
          className="message-input-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Эмодзи"
        >
          <Smile size={22} />
        </button>

        {text.trim() ? (
          <button type="submit" className="message-input-send" title="Отправить">
            <Send size={22} />
          </button>
        ) : (
          <button type="button" className="message-input-button" title="Голосовое сообщение">
            <Mic size={22} />
          </button>
        )}

        {showEmojiPicker && (
          <div className="emoji-picker-wrapper">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={320}
              height={400}
              theme="auto"
              searchPlaceholder="Поиск эмодзи..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
