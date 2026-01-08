export const users = [
  { id: 1, name: 'Анна Иванова', avatar: '👩', status: 'online', lastSeen: null },
  { id: 2, name: 'Дмитрий Петров', avatar: '👨', status: 'offline', lastSeen: new Date(Date.now() - 1000 * 60 * 5) },
  { id: 3, name: 'Елена Смирнова', avatar: '👩‍🦰', status: 'online', lastSeen: null },
  { id: 4, name: 'Сергей Волков', avatar: '👨‍💼', status: 'offline', lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: 5, name: 'Мария Козлова', avatar: '👩‍💻', status: 'online', lastSeen: null },
  { id: 6, name: 'Александр Новиков', avatar: '👨‍🔬', status: 'offline', lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: 7, name: 'Ольга Морозова', avatar: '👩‍🏫', status: 'online', lastSeen: null },
  { id: 8, name: 'Игорь Соколов', avatar: '👨‍🎨', status: 'offline', lastSeen: new Date(Date.now() - 1000 * 60 * 30) },
];

export const initialMessages = {
  1: [
    { id: 1, chatId: 1, senderId: 1, text: 'Привет! Как дела?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), status: 'read' },
    { id: 2, chatId: 1, senderId: 'me', text: 'Здравствуй! Всё отлично, спасибо!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60), status: 'read' },
    { id: 3, chatId: 1, senderId: 1, text: 'Хочу поделиться новостями 😊', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 120), status: 'read' },
    { id: 4, chatId: 1, senderId: 'me', text: 'Слушаю тебя!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 180), status: 'read' },
    { id: 5, chatId: 1, senderId: 1, text: 'Я нашла отличную работу!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), status: 'read' },
    { id: 6, chatId: 1, senderId: 'me', text: 'Поздравляю! Это прекрасно! 🎉', timestamp: new Date(Date.now() - 1000 * 60 * 30), status: 'read' },
  ],
  2: [
    { id: 7, chatId: 2, senderId: 2, text: 'Ты видел последний матч?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), status: 'read' },
    { id: 8, chatId: 2, senderId: 'me', text: 'Да, невероятная игра!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), status: 'read' },
    { id: 9, chatId: 2, senderId: 2, text: 'Полностью согласен! ⚽', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60), status: 'delivered' },
  ],
  3: [
    { id: 10, chatId: 3, senderId: 3, text: 'Не забудь про встречу завтра!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), status: 'read' },
    { id: 11, chatId: 3, senderId: 'me', text: 'Конечно, я помню. Во сколько?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 60 * 10), status: 'read' },
    { id: 12, chatId: 3, senderId: 3, text: 'В 15:00 у главного входа', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), status: 'read' },
    { id: 13, chatId: 3, senderId: 'me', text: 'Отлично, буду!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), status: 'read' },
    { id: 14, chatId: 3, senderId: 3, text: 'До встречи! 👋', timestamp: new Date(Date.now() - 1000 * 60 * 45), status: 'read' },
  ],
  4: [
    { id: 15, chatId: 4, senderId: 4, text: 'Привет! Можешь помочь с проектом?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), status: 'read' },
    { id: 16, chatId: 4, senderId: 'me', text: 'Привет! Конечно, что нужно?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7), status: 'read' },
    { id: 17, chatId: 4, senderId: 4, text: 'Нужна помощь с React компонентами', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7 + 1000 * 60 * 5), status: 'sent' },
  ],
  5: [
    { id: 18, chatId: 5, senderId: 5, text: 'Спасибо за вчерашний вечер!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), status: 'read' },
    { id: 19, chatId: 5, senderId: 'me', text: 'Мне тоже было очень приятно! ❤️', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 11), status: 'read' },
  ],
  6: [
    { id: 20, chatId: 6, senderId: 6, text: 'Добрый день!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), status: 'read' },
    { id: 21, chatId: 6, senderId: 'me', text: 'Здравствуйте!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), status: 'read' },
  ],
  7: [
    { id: 22, chatId: 7, senderId: 7, text: 'Не забудь про домашнее задание! 📚', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), status: 'read' },
    { id: 23, chatId: 7, senderId: 'me', text: 'Уже сделал, спасибо за напоминание!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), status: 'read' },
    { id: 24, chatId: 7, senderId: 7, text: 'Отлично! Молодец! 👏', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), status: 'delivered' },
  ],
  8: [
    { id: 25, chatId: 8, senderId: 8, text: 'Посмотри мою новую картину!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10), status: 'read' },
    { id: 26, chatId: 8, senderId: 'me', text: 'С удовольствием посмотрю!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9), status: 'read' },
    { id: 27, chatId: 8, senderId: 8, text: 'Скину ссылку позже', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9 + 1000 * 60 * 5), status: 'sent' },
  ],
};

export const initialChats = users.map(user => {
  const messages = initialMessages[user.id] || [];
  const lastMessage = messages[messages.length - 1];
  const unreadCount = messages.filter(m => m.senderId !== 'me' && m.status !== 'read').length;
  
  return {
    id: user.id,
    userId: user.id,
    name: user.name,
    avatar: user.avatar,
    lastMessage: lastMessage?.text || '',
    lastMessageTime: lastMessage?.timestamp || new Date(),
    unreadCount: unreadCount,
    isPinned: [1, 3].includes(user.id),
    isArchived: false,
    isOnline: user.status === 'online',
    isTyping: false,
  };
});

export const currentUser = {
  id: 'me',
  name: 'Вы',
  avatar: '😊',
};
