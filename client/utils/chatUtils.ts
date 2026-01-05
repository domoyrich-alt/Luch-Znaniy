/**
 * CHAT UTILS
 * Утилиты для чатов
 */

/**
 * Форматирует время последнего посещения пользователя
 * @param lastSeenAt - timestamp последнего посещения (ms) или Date
 * @param isOnline - пользователь онлайн
 * @returns Строка: "В сети", "Был(а) недавно", "Был(а) в 15:45", "Был(а) вчера в 15:45" и т.д.
 */
export function formatLastSeen(lastSeenAt?: number | Date | string | null, isOnline?: boolean): string {
  // Если онлайн
  if (isOnline) {
    return 'В сети';
  }
  
  // Если нет данных
  if (!lastSeenAt) {
    return 'Был(а) недавно';
  }
  
  // Конвертируем в Date
  let lastSeenDate: Date;
  if (typeof lastSeenAt === 'number') {
    lastSeenDate = new Date(lastSeenAt);
  } else if (typeof lastSeenAt === 'string') {
    lastSeenDate = new Date(lastSeenAt);
  } else {
    lastSeenDate = lastSeenAt;
  }
  
  // Проверяем валидность даты
  if (isNaN(lastSeenDate.getTime())) {
    return 'Был(а) недавно';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Меньше минуты назад
  if (diffMinutes < 1) {
    return 'Был(а) только что';
  }
  
  // Меньше 5 минут назад
  if (diffMinutes < 5) {
    return 'Был(а) недавно';
  }
  
  // Форматирование времени HH:MM
  const timeStr = lastSeenDate.toLocaleTimeString('ru', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Сегодня
  if (diffDays === 0) {
    return `Был(а) в ${timeStr}`;
  }
  
  // Вчера
  if (diffDays === 1) {
    return `Был(а) вчера в ${timeStr}`;
  }
  
  // На этой неделе (до 7 дней)
  if (diffDays < 7) {
    const days = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
    const dayName = days[lastSeenDate.getDay()];
    // "в среду", "во вторник"
    const preposition = dayName === 'вторник' || dayName === 'воскресенье' ? 'во' : 'в';
    return `Был(а) ${preposition} ${dayName}`;
  }
  
  // Более недели назад
  const dateStr = lastSeenDate.toLocaleDateString('ru', {
    day: 'numeric',
    month: 'short',
  });
  return `Был(а) ${dateStr}`;
}

/**
 * Форматирует время сообщения
 * @param time - время сообщения
 * @returns Строка времени в формате "15:45" или "Вчера" или "Пн" и т.д.
 */
export function formatMessageTime(time?: string | Date | null): string {
  if (!time) return '';
  
  const date = typeof time === 'string' ? new Date(time) : time;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Сегодня - показываем время
  if (diffDays === 0) {
    return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Вчера
  if (diffDays === 1) {
    return 'Вчера';
  }
  
  // На этой неделе
  if (diffDays < 7) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  }
  
  // Более недели назад
  return date.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
}

/**
 * Форматирует длительность записи (голосовое/видео)
 * @param seconds - длительность в секундах
 * @returns Строка в формате "M:SS"
 */
export function formatRecordingDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
