import { format, isToday, isYesterday } from 'date-fns';

export const formatMessageTime = (date) => {
  if (!date) return '';
  const messageDate = new Date(date);
  return format(messageDate, 'HH:mm');
};

export const formatChatTime = (date) => {
  if (!date) return '';
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return 'вчера';
  } else {
    return format(messageDate, 'dd.MM.yyyy');
  }
};

export const formatLastSeen = (date) => {
  if (!date) return 'давно';
  
  const lastSeenDate = new Date(date);
  
  if (isToday(lastSeenDate)) {
    return `в сети в ${format(lastSeenDate, 'HH:mm')}`;
  } else if (isYesterday(lastSeenDate)) {
    return `в сети вчера в ${format(lastSeenDate, 'HH:mm')}`;
  } else {
    return `в сети ${format(lastSeenDate, 'dd.MM.yyyy')}`;
  }
};

export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp);
    let dateKey;
    
    if (isToday(date)) {
      dateKey = 'Сегодня';
    } else if (isYesterday(date)) {
      dateKey = 'Вчера';
    } else {
      dateKey = format(date, 'dd MMMM yyyy');
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });
  
  return groups;
};

export const shouldGroupMessages = (currentMsg, previousMsg) => {
  if (!previousMsg) return false;
  
  // Group if same sender and within 2 minutes
  const timeDiff = new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp);
  return currentMsg.senderId === previousMsg.senderId && timeDiff < 2 * 60 * 1000;
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const highlightText = (text, query) => {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};
