/**
 * WEBSOCKET SERVER для мгновенной доставки сообщений
 * 
 * Поддерживает:
 * - Подключение/отключение пользователей
 * - Отправка сообщений в реальном времени
 * - Уведомления о печати
 * - Онлайн статус
 * - Прочтение сообщений
 */

// @ts-ignore - ws module types
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

// Типы сообщений WebSocket
export type WSMessageType = 
  | 'auth'
  | 'message'
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'message_deleted'
  | 'typing'
  | 'stop_typing'
  | 'online'
  | 'offline'
  | 'error'
  | 'pong';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: number;
}

// Хранилище подключений
const connections = new Map<number, WebSocket>(); // userId -> WebSocket
const userChats = new Map<number, Set<string>>(); // userId -> Set<chatId>

// WebSocket сервер
let wss: WebSocketServer;

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ 
    server,
    path: '/ws',
  });

  console.log('[WebSocket] Server started on /ws');

  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;
    let isAlive = true;

    console.log('[WebSocket] New connection');

    // Ping/Pong для проверки соединения
    const pingInterval = setInterval(() => {
      if (!isAlive) {
        console.log('[WebSocket] Connection dead, terminating');
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('pong', () => {
      isAlive = true;
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            // Авторизация пользователя
            userId = message.payload.userId;
            if (userId) {
              connections.set(userId, ws);
              userChats.set(userId, new Set(message.payload.chatIds || []));
              
              // Уведомляем о том что пользователь онлайн
              broadcastToContacts(userId, {
                type: 'online',
                payload: { userId },
                timestamp: Date.now(),
              });
              
              console.log(`[WebSocket] User ${userId} authenticated`);
              
              // Отправляем подтверждение
              sendToUser(userId, {
                type: 'auth',
                payload: { success: true, userId },
                timestamp: Date.now(),
              });
            }
            break;

          case 'typing':
            // Пользователь печатает
            if (userId && message.payload.chatId) {
              const chatId = message.payload.chatId;
              broadcastToChat(chatId, {
                type: 'typing',
                payload: { 
                  chatId, 
                  userId,
                  userName: message.payload.userName,
                },
                timestamp: Date.now(),
              }, userId);
            }
            break;

          case 'stop_typing':
            // Пользователь перестал печатать
            if (userId && message.payload.chatId) {
              const chatId = message.payload.chatId;
              broadcastToChat(chatId, {
                type: 'stop_typing',
                payload: { chatId, userId },
                timestamp: Date.now(),
              }, userId);
            }
            break;

          case 'message_read':
            // Сообщения прочитаны
            if (userId && message.payload.chatId) {
              broadcastToChat(message.payload.chatId, {
                type: 'message_read',
                payload: {
                  chatId: message.payload.chatId,
                  userId,
                  messageIds: message.payload.messageIds,
                },
                timestamp: Date.now(),
              }, userId);
            }
            break;

          default:
            console.log(`[WebSocket] Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: Date.now(),
        }));
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      
      if (userId) {
        connections.delete(userId);
        userChats.delete(userId);
        
        // Уведомляем о том что пользователь оффлайн
        broadcastToContacts(userId, {
          type: 'offline',
          payload: { userId, lastSeenAt: Date.now() },
          timestamp: Date.now(),
        });
        
        console.log(`[WebSocket] User ${userId} disconnected`);
      }
    });

    ws.on('error', (error: Error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  return wss;
}

// Отправить сообщение конкретному пользователю
export function sendToUser(userId: number, message: WSMessage): boolean {
  const ws = connections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// Отправить сообщение всем участникам чата (кроме отправителя)
export function broadcastToChat(chatId: string, message: WSMessage, excludeUserId?: number) {
  connections.forEach((ws, odlerId) => {
    if (excludeUserId && odlerId === excludeUserId) return;
    
    const chats = userChats.get(odlerId);
    if (chats?.has(chatId) && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Отправить сообщение всем контактам пользователя (для онлайн статуса)
export function broadcastToContacts(userId: number, message: WSMessage) {
  // В простой реализации отправляем всем подключенным
  // В продакшене нужно отправлять только контактам
  connections.forEach((ws, otherId) => {
    if (otherId !== userId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Уведомить о новом сообщении
export function notifyNewMessage(chatId: string, senderId: number, message: any) {
  const wsMessage: WSMessage = {
    type: 'message',
    payload: {
      chatId,
      message: {
        id: message.id,
        chatId,
        senderId,
        senderName: message.senderName,
        text: message.message,
        type: message.mediaType || 'text',
        mediaUrl: message.mediaUrl,
        status: 'delivered',
        createdAt: new Date(message.createdAt).getTime(),
      },
    },
    timestamp: Date.now(),
  };

  // Отправляем всем в чате кроме отправителя
  broadcastToChat(chatId, wsMessage, senderId);
  
  // Подтверждаем отправителю что сообщение доставлено
  sendToUser(senderId, {
    type: 'message_delivered',
    payload: {
      chatId,
      messageId: message.id,
      localId: message.localId,
    },
    timestamp: Date.now(),
  });

  console.log(`[WebSocket] Message ${message.id} sent to chat ${chatId}`);
}

// Добавить чат для пользователя
export function addUserToChat(userId: number, chatId: string) {
  const chats = userChats.get(userId);
  if (chats) {
    chats.add(chatId);
  }
}

// Проверить онлайн ли пользователь
export function isUserOnline(userId: number): boolean {
  const ws = connections.get(userId);
  return ws !== undefined && ws.readyState === WebSocket.OPEN;
}

// Получить список онлайн пользователей
export function getOnlineUsers(): number[] {
  return Array.from(connections.keys());
}
