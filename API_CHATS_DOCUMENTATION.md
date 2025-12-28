# 📱 API Документация для приватных чатов

## Обзор
Реализована полная система приватных чатов с поддержкой текста, фото и видео. Система включает поиск пользователей по username и хранение всех сообщений в БД.

## Таблицы БД

### `user_profiles`
```sql
- id (int, PK)
- userId (int, FK → users)
- username (string, UNIQUE) - юзернейм для поиска
- bio (text) - описание профиля
- avatarUrl (string) - URL аватара
- phoneNumber (string)
- birthday (string)
- favoriteMusic (string)
- status (string) - статус "в сети"
- isOnline (boolean)
- lastSeenAt (timestamp)
- createdAt (timestamp)
```

### `private_chats`
```sql
- id (int, PK)
- user1Id (int, FK → users)
- user2Id (int, FK → users)
- lastMessageAt (timestamp) - время последнего сообщения
- createdAt (timestamp)
```

### `private_messages`
```sql
- id (int, PK)
- chatId (int, FK → private_chats)
- senderId (int, FK → users)
- message (text) - текст сообщения
- mediaType (string) - 'photo' | 'video' | 'file'
- mediaUrl (string) - URL загруженного файла
- mediaFileName (string)
- mediaSize (int) - в байтах
- isRead (boolean)
- readAt (timestamp)
- createdAt (timestamp)
```

## API Endpoints

### 1️⃣ Профиль пользователя

#### GET `/api/user/:userId/profile`
Получить профиль пользователя
```typescript
Response:
{
  id: number;
  userId: number;
  username: string;
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  birthday?: string;
  favoriteMusic?: string;
  status?: string;
  isOnline: boolean;
  lastSeenAt: string;
}
```

#### PATCH `/api/user/:userId/profile`
Обновить профиль пользователя
```typescript
Request:
{
  username?: string;
  bio?: string;
  phoneNumber?: string;
  birthday?: string;
  favoriteMusic?: string;
  status?: string;
  avatarUrl?: string;
}
```

### 2️⃣ Поиск пользователей

#### GET `/api/users/search?query=<username>`
Поиск пользователей по username (case-insensitive)
```typescript
Response: UserProfile[]
```

### 3️⃣ Приватные чаты

#### POST `/api/chats/private`
Создать или получить приватный чат
```typescript
Request:
{
  user1Id: number;
  user2Id: number;
}

Response:
{
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt?: string;
  createdAt: string;
}
```

#### GET `/api/user/:userId/chats`
Получить все чаты пользователя
```typescript
Response: Array<{
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt?: string;
  createdAt: string;
  otherUser: {
    id: number;
    firstName: string;
    lastName: string;
    userId: number;
    username: string;
    bio?: string;
    avatarUrl?: string;
    status?: string;
    isOnline: boolean;
    lastSeenAt: string;
  }
}>
```

### 4️⃣ Сообщения

#### GET `/api/chats/:chatId/messages?limit=50&offset=0`
Получить сообщения чата с пагинацией
```typescript
Response: PrivateMessage[]
```

#### POST `/api/chats/:chatId/messages`
Отправить текстовое сообщение
```typescript
Request:
{
  senderId: number;
  message: string;
}

Response: PrivateMessage
```

#### POST `/api/chats/:chatId/messages` (с файлом)
Отправить сообщение с фото/видео
```typescript
Request:
{
  senderId: number;
  mediaUrl: string; // URL от /api/upload
  mediaType: 'photo' | 'video' | 'file';
  mediaFileName: string;
  mediaSize: number;
}

Response: PrivateMessage
```

#### POST `/api/chats/:chatId/read`
Отметить сообщения как прочитанные
```typescript
Request:
{
  userId: number;
}

Response: { success: true }
```

### 5️⃣ Загрузка файлов

#### POST `/api/upload` (multipart/form-data)
Загрузить фото или видео
```typescript
Request FormData:
- file: File (max 100MB)

Response:
{
  success: true;
  fileName: string;
  fileUrl: string; // URL для доступа
  fileSize: number;
  mimeType: string;
}

Допустимые типы:
- image/jpeg, image/png, image/gif, image/webp
- video/mp4, video/quicktime, video/mpeg
- application/pdf
```

#### GET `/uploads/:filename`
Получить загруженный файл

## Типы данных (TypeScript)

```typescript
interface PrivateMessage {
  id: number;
  chatId: number;
  senderId: number;
  message?: string;
  mediaType?: "photo" | "video" | "file";
  mediaUrl?: string;
  mediaFileName?: string;
  mediaSize?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface UserProfile {
  id: number;
  userId: number;
  username: string;
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  birthday?: string;
  favoriteMusic?: string;
  status?: string;
  isOnline: boolean;
  lastSeenAt: string;
}

interface PrivateChat {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt?: string;
  createdAt: string;
  otherUser?: UserProfile & {
    firstName: string;
    lastName: string;
    id: number;
  };
}
```

## Клиентский сервис (ChatService)

```typescript
// Использование
import ChatService from "@/services/ChatService";

// Получить профиль
const profile = await ChatService.getUserProfile(userId);

// Обновить профиль
await ChatService.updateUserProfile(userId, {
  username: "newname",
  bio: "Hello",
});

// Поиск пользователей
const results = await ChatService.searchUsers("alex");

// Создать чат
const chat = await ChatService.getOrCreatePrivateChat(userId1, userId2);

// Получить чаты
const chats = await ChatService.getUserChats(userId);

// Получить сообщения
const messages = await ChatService.getChatMessages(chatId, 50, 0);

// Отправить сообщение
await ChatService.sendMessage(chatId, userId, "Hello!");

// Загрузить файл
const { fileUrl } = await ChatService.uploadFile(uri, "photo.jpg");

// Отправить фото
await ChatService.sendMediaMessage(
  chatId,
  userId,
  fileUrl,
  "photo",
  "photo.jpg",
  1024000
);

// Отметить прочитанным
await ChatService.markMessagesAsRead(chatId, userId);
```

## Примеры использования

### Пример 1: Создание нового чата и отправка сообщения

```typescript
// 1. Поиск пользователя
const users = await ChatService.searchUsers("alex");
const targetUser = users[0];

// 2. Создание чата
const chat = await ChatService.getOrCreatePrivateChat(
  currentUserId,
  targetUser.userId
);

// 3. Отправка сообщения
await ChatService.sendMessage(chat.id, currentUserId, "Hi!");

// 4. Получение сообщений
const messages = await ChatService.getChatMessages(chat.id);
```

### Пример 2: Отправка фото

```typescript
// 1. Выбрать фото
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
});

// 2. Загрузить файл
const { fileUrl, fileSize } = await ChatService.uploadFile(
  result.assets[0].uri,
  "photo.jpg"
);

// 3. Отправить как сообщение
await ChatService.sendMediaMessage(
  chatId,
  userId,
  fileUrl,
  "photo",
  "photo.jpg",
  fileSize
);
```

## Миграции (Drizzle)

```bash
# Создать миграцию
npm run db:generate

# Применить миграцию
npm run db:push
```

## Заметки

- `username` обязателен и должен быть уникальным для каждого пользователя
- Системе требуется папка `uploads/` в корне сервера для хранения файлов
- Максимальный размер файла: 100MB
- Все временные метки в UTC (ISO 8601)
- Поиск по username выполняется без учёта регистра (ILIKE в PostgreSQL)
