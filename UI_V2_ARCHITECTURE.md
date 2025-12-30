# Архитектура UI V2 - Telegram-стиль

## Обзор

Новая архитектура UI построена на принципах:
1. **Разделение компонентов** - каждый компонент отвечает за одну задачу
2. **Единая тема** - все цвета и размеры в одном месте
3. **Правильный свайп** - гистерезис для определения направления жеста
4. **Анимации** - плавные переходы и feedback

## Структура файлов

```
client/
├── constants/
│   └── telegramDarkTheme.ts     # Темная тема (цвета, размеры, типографика)
│
├── components/chat/v2/
│   ├── index.ts                 # Экспорт всех компонентов
│   ├── ChatListWidget.tsx       # Список чатов (левая панель)
│   ├── ChatHeader.tsx           # Верхняя панель чата
│   ├── MessageBubble.tsx        # Пузырь сообщения
│   ├── ChatInput.tsx            # Поле ввода
│   ├── AttachMenu.tsx           # Меню скрепки
│   ├── EmojiPicker.tsx          # Клавиатура смайликов
│   └── BottomNavigation.tsx     # Нижняя навигация
│
└── screens/v2/
    ├── index.ts                 # Экспорт экранов
    ├── ChatsListScreenV2.tsx    # Экран списка чатов
    └── ChatScreenV2.tsx         # Экран чата
```

## Цветовая схема

```typescript
// Основные цвета
background: '#0F0F0F'        // Главный фон (черный)
backgroundSecondary: '#1A1A1A' // Левая панель
backgroundTertiary: '#2D2D2D'  // Карточки

// Акцент
primary: '#8A2BE2'           // Неоново-фиолетовый

// Сообщения
messageMine: '#8A2BE2'       // Мои сообщения - фиолетовый
messageTheirs: '#2D2D2D'     // Чужие сообщения - серый
```

## Компоненты

### 1. ChatListWidget
Список чатов с правильным свайпом.

```typescript
<ChatListWidget
  chats={chats}
  onChatPress={(chat) => openChat(chat)}
  onDeleteChat={(chatId) => deleteChat(chatId)}
  onPinChat={(chatId) => pinChat(chatId)}
  onRefresh={loadChats}
  refreshing={refreshing}
/>
```

**Особенности свайпа:**
- Гистерезис: горизонтальное движение должно превышать вертикальное в 1.5 раза
- Блокировка скролла при активном свайпе
- Эластичное сопротивление за пределами лимита
- Haptic feedback при достижении порога

### 2. ChatHeader
Верхняя панель с аватаром, именем и кнопками.

```typescript
<ChatHeader
  chatName="Имя пользователя"
  avatar="https://..."
  isOnline={true}
  lastSeen={new Date()}
  isTyping={false}
  onBackPress={goBack}
  onCallPress={startCall}
  onVideoCallPress={startVideoCall}
  onSearchPress={openSearch}
  onMenuPress={openMenu}
/>
```

### 3. MessageBubble
Сообщение с правильными цветами и скруглениями.

```typescript
<MessageBubble
  message={{
    id: 1,
    text: "Привет!",
    senderId: 123,
    createdAt: new Date(),
    isRead: true,
  }}
  isOwn={true}
  onImagePress={(url) => openImage(url)}
/>
```

**Стили сообщений:**
- Мои: фиолетовый фон, маленький угол справа сверху
- Чужие: серый фон, маленький угол слева сверху

### 4. ChatInput
Поле ввода со скрепкой, смайликами и микрофоном.

```typescript
<ChatInput
  value={text}
  onChangeText={setText}
  onSend={sendMessage}
  onAttachPress={openAttach}
  onEmojiPress={openEmoji}
  replyTo={replyMessage}
  onCancelReply={cancelReply}
  mediaPreview={selectedMedia}
  onCancelMedia={cancelMedia}
/>
```

### 5. AttachMenu
Меню скрепки с 2 колонками.

```typescript
<AttachMenu
  visible={visible}
  onClose={closeMenu}
  onSelect={(option) => handleAttach(option)}
/>
```

**Опции:** photo, video, file, location, contact, gift

### 6. EmojiPicker
Клавиатура смайликов с вкладками.

```typescript
<EmojiPicker
  visible={visible}
  onClose={closePicker}
  onEmojiSelect={(emoji) => addEmoji(emoji)}
/>
```

**Категории:** 😀 👋 🐱 🍎 ⚽ 🚗 💡 🏁

### 7. BottomNavigation
Нижняя навигация с 5 вкладками.

```typescript
<BottomNavigation
  activeTab="chats"
  onTabPress={(tab) => navigate(tab)}
  unreadChats={5}
/>
```

**Вкладки:** Главная, Действия, Чаты, Кафетерий, Профиль

## Переключение на V2

В файле `ChatsStackNavigator.tsx`:

```typescript
// Флаг для переключения на новую архитектуру
const USE_V2_UI = true;  // true = V2, false = старая версия
```

## Импорт компонентов

```typescript
import {
  ChatListWidget,
  ChatHeader,
  MessageBubble,
  ChatInput,
  AttachMenu,
  EmojiPicker,
  BottomNavigation,
  TelegramDarkColors,
  TelegramSizes,
  type Chat,
  type Message,
} from '@/components/chat/v2';
```
