import React, { useEffect, useRef } from 'react';
import { Copy, Edit, Trash2, Reply, Pin } from 'lucide-react';
import './MessageContextMenu.css';

const MessageContextMenu = ({ message, isOwn, position, onClose, onEdit, onDelete, onReply }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    onClose();
  };

  const handleEdit = () => {
    onEdit(message);
    onClose();
  };

  const handleDelete = () => {
    onDelete(message.id);
    onClose();
  };

  const handleReply = () => {
    onReply(message);
    onClose();
  };

  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div
        ref={menuRef}
        className="context-menu animate-fade-in"
        style={{ top: position.y, left: position.x }}
      >
        <button className="context-menu-item" onClick={handleReply}>
          <Reply size={18} />
          <span>Ответить</span>
        </button>

        {isOwn && (
          <button className="context-menu-item" onClick={handleEdit}>
            <Edit size={18} />
            <span>Редактировать</span>
          </button>
        )}

        <button className="context-menu-item" onClick={handleCopy}>
          <Copy size={18} />
          <span>Копировать текст</span>
        </button>

        <button className="context-menu-item">
          <Pin size={18} />
          <span>Закрепить</span>
        </button>

        <div className="context-menu-divider" />

        <button className="context-menu-item context-menu-item-danger" onClick={handleDelete}>
          <Trash2 size={18} />
          <span>Удалить</span>
        </button>
      </div>
    </>
  );
};

export default MessageContextMenu;
