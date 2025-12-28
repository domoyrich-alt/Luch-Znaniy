// ===== ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ CHAT SERVICE =====

// 1️⃣ ПОЛУЧИТЬ ИЛИ СОЗДАТЬ ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
import ChatService from "@/services/ChatService";

// Получить профиль пользователя
const profile = await ChatService.getUserProfile(userId);
console.log(profile);
// {
//   id: 1,
//   userId: 1,
//   username: "alex_ivanov",
//   bio: "Student",
//   avatarUrl: "...",
//   status: "Online",
//   isOnline: true,
//   lastSeenAt: "2024-12-19T10:30:00Z"
// }

// 2️⃣ ОБНОВИТЬ ПРОФИЛЬ
await ChatService.updateUserProfile(userId, {
  username: "alex_ivanov",
  bio: "Ученик 11А класса",
  status: "Готовлю домашку",
  avatarUrl: "https://example.com/avatar.jpg",
  phoneNumber: "+7-999-123-45-67",
  birthday: "2007-05-15",
  favoriteMusic: "Arctic Monkeys",
});

// 3️⃣ ПОИСК ПОЛЬЗОВАТЕЛЕЙ ПО USERNAME
const searchResults = await ChatService.searchUsers("alex");
// Результат:
// [
//   {
//     id: 1,
//     userId: 1,
//     username: "alex_ivanov",
//     bio: "Student",
//     status: "Online",
//     isOnline: true,
//     ...
//   },
//   {
//     id: 2,
//     userId: 3,
//     username: "alex_petrov",
//     bio: "Teacher",
//     status: "In class",
//     isOnline: false,
//     ...
//   }
// ]

// 4️⃣ СОЗДАТЬ ИЛИ ПОЛУЧИТЬ ПРИВАТНЫЙ ЧАТ
const chat = await ChatService.getOrCreatePrivateChat(
  currentUserId,    // 1
  targetUserId      // 2
);
// Результат:
// {
//   id: 5,
//   user1Id: 1,
//   user2Id: 2,
//   lastMessageAt: "2024-12-19T10:45:00Z",
//   createdAt: "2024-12-19T09:00:00Z",
//   otherUser: {
//     id: 2,
//     firstName: "Мария",
//     lastName: "Петрова",
//     userId: 2,
//     username: "maria_petrova",
//     bio: "Студентка",
//     status: "Учусь",
//     isOnline: true
//   }
// }

// 5️⃣ ПОЛУЧИТЬ ВСЕ ЧАТЫ ПОЛЬЗОВАТЕЛЯ
const allChats = await ChatService.getUserChats(userId);
// Результат: массив PrivateChat с информацией о собеседниках

// 6️⃣ ПОЛУЧИТЬ СООБЩЕНИЯ ЧАТА (С ПАГИНАЦИЕЙ)
const messages = await ChatService.getChatMessages(
  chatId,    // ID чата
  50,        // limit
  0          // offset
);
// Результат:
// [
//   {
//     id: 1,
//     chatId: 5,
//     senderId: 1,
//     message: "Привет!",
//     mediaType: null,
//     mediaUrl: null,
//     isRead: true,
//     readAt: "2024-12-19T10:46:00Z",
//     createdAt: "2024-12-19T10:45:00Z"
//   },
//   {
//     id: 2,
//     chatId: 5,
//     senderId: 2,
//     message: "Привет! Как дела?",
//     mediaType: null,
//     isRead: true,
//     readAt: "2024-12-19T10:47:00Z",
//     createdAt: "2024-12-19T10:46:00Z"
//   }
// ]

// 7️⃣ ОТПРАВИТЬ ТЕКСТОВОЕ СООБЩЕНИЕ
const newMessage = await ChatService.sendMessage(
  chatId,
  senderId,
  "Привет! Как дела?"
);
// Результат:
// {
//   id: 3,
//   chatId: 5,
//   senderId: 1,
//   message: "Привет! Как дела?",
//   mediaType: null,
//   isRead: false,
//   createdAt: "2024-12-19T10:47:30Z"
// }

// 8️⃣ ЗАГРУЗИТЬ ФАЙЛ (ФОТО/ВИДЕО)
import * as ImagePicker from "expo-image-picker";

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
});

if (!result.cancelled && result.assets[0]) {
  const asset = result.assets[0];
  
  const uploadResult = await ChatService.uploadFile(
    asset.uri,                              // file:///data/user/0/...
    asset.uri.split("/").pop() || "photo.jpg"
  );
  
  // Результат:
  // {
  //   fileUrl: "http://localhost:5000/uploads/photo-1703063450000.jpg",
  //   mimeType: "image/jpeg",
  //   fileSize: 2048000  // в байтах
  // }
}

// 9️⃣ ОТПРАВИТЬ ФОТО
const photoMessage = await ChatService.sendMediaMessage(
  chatId,
  senderId,
  "http://localhost:5000/uploads/photo-1703063450000.jpg",  // fileUrl
  "photo",  // mediaType
  "photo.jpg",  // mediaFileName
  2048000  // mediaSize в байтах
);
// Результат:
// {
//   id: 4,
//   chatId: 5,
//   senderId: 1,
//   message: null,
//   mediaType: "photo",
//   mediaUrl: "http://localhost:5000/uploads/photo-1703063450000.jpg",
//   mediaFileName: "photo.jpg",
//   mediaSize: 2048000,
//   isRead: false,
//   createdAt: "2024-12-19T10:48:00Z"
// }

// 🔟 ОТПРАВИТЬ ВИДЕО
const videoMessage = await ChatService.sendMediaMessage(
  chatId,
  senderId,
  "http://localhost:5000/uploads/video-1703063450000.mp4",
  "video",
  "video.mp4",
  50000000  // 50MB
);

// 1️⃣1️⃣ ОТМЕТИТЬ СООБЩЕНИЯ КАК ПРОЧИТАННЫЕ
await ChatService.markMessagesAsRead(chatId, userId);
// После этого все сообщения от других пользователей будут помечены как isRead: true

// ===== ПОЛНЫЙ ПРИМЕР: СОЗДАНИЕ ЧАТА И ОТПРАВКА СООБЩЕНИЯ =====

async function startChatWithUser() {
  try {
    // 1. Поиск пользователя
    const searchResults = await ChatService.searchUsers("alex");
    if (searchResults.length === 0) {
      console.log("Пользователь не найден!");
      return;
    }
    
    const targetUser = searchResults[0];
    console.log(`Найден пользователь: ${targetUser.username}`);
    
    // 2. Создание чата
    const chat = await ChatService.getOrCreatePrivateChat(
      currentUserId,
      targetUser.userId
    );
    console.log(`Чат создан/получен с ID: ${chat.id}`);
    
    // 3. Отправка сообщения
    const message = await ChatService.sendMessage(
      chat.id,
      currentUserId,
      "Привет! Как дела?"
    );
    console.log(`Сообщение отправлено: ${message.message}`);
    
    // 4. Отправка фото
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    
    if (!result.cancelled && result.assets[0]) {
      const { fileUrl, fileSize } = await ChatService.uploadFile(
        result.assets[0].uri,
        "photo.jpg"
      );
      
      const photoMessage = await ChatService.sendMediaMessage(
        chat.id,
        currentUserId,
        fileUrl,
        "photo",
        "photo.jpg",
        fileSize
      );
      console.log(`Фото отправлено: ${photoMessage.mediaUrl}`);
    }
    
    // 5. Получить все сообщения
    const messages = await ChatService.getChatMessages(chat.id, 50);
    console.log(`Всего сообщений в чате: ${messages.length}`);
    messages.forEach((msg, idx) => {
      if (msg.message) {
        console.log(`${idx + 1}. ${msg.senderId === currentUserId ? "Я" : "Собеседник"}: ${msg.message}`);
      } else if (msg.mediaType) {
        console.log(`${idx + 1}. Отправлено ${msg.mediaType}`);
      }
    });
    
    // 6. Отметить все как прочитанные
    await ChatService.markMessagesAsRead(chat.id, currentUserId);
    console.log("Все сообщения отмечены как прочитанные");
    
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

// ===== ОБРАБОТКА ОШИБОК =====

async function safeChat() {
  try {
    const messages = await ChatService.getChatMessages(chatId);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Ошибка загрузки сообщений:", error.message);
      // "Ошибка получения сообщений"
      // "Ошибка отправки сообщения"
      // "Ошибка загрузки файла"
    }
  }
}

// ===== ИНТЕГРАЦИЯ С REACT NATIVE =====

import React, { useState, useEffect } from "react";
import { View, FlatList, TextInput, Pressable, Image } from "react-native";
import { useRoute } from "@react-navigation/native";

export default function ChatScreen() {
  const route = useRoute();
  const { chatId, otherUserId } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  // Загрузить сообщения при открытии
  useEffect(() => {
    loadMessages();
  }, [chatId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const msgs = await ChatService.getChatMessages(chatId, 100);
      setMessages(msgs);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      const msg = await ChatService.sendMessage(chatId, userId, inputText);
      setMessages([...messages, msg]);
      setInputText("");
    } catch (error) {
      console.error("Ошибка отправки:", error);
    }
  };

  return (
    <View>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View>
            {item.message && <Text>{item.message}</Text>}
            {item.mediaType === "photo" && <Image source={{ uri: item.mediaUrl }} />}
            {item.mediaType === "video" && <Text>📹 Видео</Text>}
          </View>
        )}
      />
      <TextInput value={inputText} onChangeText={setInputText} placeholder="Сообщение..." />
      <Pressable onPress={sendMessage}>
        <Text>Отправить</Text>
      </Pressable>
    </View>
  );
}
