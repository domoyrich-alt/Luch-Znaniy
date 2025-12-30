import { getApiUrl as getBaseApiUrl } from "@/lib/query-client";

const API_URL = getBaseApiUrl();

export interface PrivateMessage {
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

export interface UserProfile {
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

export interface PrivateChat {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt?: string;
  createdAt: string;
  otherUser?: {
    id: number;
    firstName: string;
    lastName: string;
  } & UserProfile;
}

class ChatService {
  private baseUrl = API_URL;

  // Получить профиль пользователя
  async getUserProfile(userId: number): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/api/user/${userId}/profile`);
    if (!response.ok) throw new Error("Ошибка получения профиля");
    return response.json();
  }

  // Обновить профиль пользователя
  async updateUserProfile(
    userId: number,
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/api/user/${userId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Ошибка обновления профиля");
    return response.json();
  }

  // Поиск пользователей по username
  async searchUsers(query: string): Promise<UserProfile[]> {
    const response = await fetch(
      `${this.baseUrl}/api/users/search?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error("Ошибка поиска");
    return response.json();
  }

  // Получить или создать приватный чат
  async getOrCreatePrivateChat(
    user1Id: number,
    user2Id: number
  ): Promise<PrivateChat> {
    const response = await fetch(`${this.baseUrl}/api/chats/private`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user1Id, user2Id }),
    });
    if (!response.ok) throw new Error("Ошибка создания чата");
    return response.json();
  }

  // Получить все чаты пользователя
  async getUserChats(userId: number): Promise<PrivateChat[]> {
    const response = await fetch(`${this.baseUrl}/api/user/${userId}/chats`);
    if (!response.ok) throw new Error("Ошибка получения чатов");
    return response.json();
  }

  // Получить сообщения из чата
  async getChatMessages(
    chatId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<PrivateMessage[]> {
    const response = await fetch(
      `${this.baseUrl}/api/chats/${chatId}/messages?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) throw new Error("Ошибка получения сообщений");
    return response.json();
  }

  // Отправить текстовое сообщение
  async sendMessage(
    chatId: number,
    senderId: number,
    message: string
  ): Promise<PrivateMessage> {
    const response = await fetch(`${this.baseUrl}/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, message }),
    });
    if (!response.ok) throw new Error("Ошибка отправки сообщения");
    return response.json();
  }

  // Отправить сообщение с файлом
  async sendMediaMessage(
    chatId: number,
    senderId: number,
    mediaUrl: string,
    mediaType: "photo" | "video" | "file",
    mediaFileName: string,
    mediaSize: number
  ): Promise<PrivateMessage> {
    const response = await fetch(`${this.baseUrl}/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId,
        mediaUrl,
        mediaType,
        mediaFileName,
        mediaSize,
      }),
    });
    if (!response.ok) throw new Error("Ошибка отправки файла");
    return response.json();
  }

  // Загрузить файл
  async uploadFile(fileUri: string, fileName: string): Promise<{
    fileUrl: string;
    mimeType: string;
    fileSize: number;
  }> {
    const formData = new FormData();

    // @ts-ignore
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: this.getMimeType(fileName),
    });

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Ошибка загрузки файла");

    const result = await response.json();
    return {
      fileUrl: this.baseUrl + result.fileUrl,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
    };
  }

  // Отметить сообщения как прочитанные
  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/chats/${chatId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error("Ошибка отметки сообщений");
  }

  // Вспомогательный метод для определения типа файла
  private getMimeType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      mp4: "video/mp4",
      mov: "video/quicktime",
      mpeg: "video/mpeg",
      pdf: "application/pdf",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}

export default new ChatService();
