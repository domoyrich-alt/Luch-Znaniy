/**
 * WEBSOCKET CLIENT для мгновенной доставки сообщений
 * 
 * Особенности:
 * - Автоматическое переподключение
 * - Очередь сообщений при отключении
 * - Heartbeat для проверки соединения
 * - События: message, typing, online/offline, read
 */

// Типы сообщений
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

type MessageHandler = (message: WSMessage) => void;

// Базовый URL API
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://hurricane-excited-providers-manhattan.trycloudflare.com';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private userId: number | null = null;
  private chatIds: string[] = [];
  private handlers: Map<WSMessageType, Set<MessageHandler>> = new Map();
  private messageQueue: WSMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Подключиться к WebSocket серверу
  connect(userId: number, chatIds: string[] = []) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('[WS Client] Already connected or connecting');
      return;
    }

    this.userId = userId;
    this.chatIds = chatIds;
    this.isConnecting = true;

    try {
      // Получаем URL сервера и меняем http на ws
      const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws';
      
      console.log('[WS Client] Connecting to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WS Client] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Авторизуемся
        this.send({
          type: 'auth',
          payload: { userId: this.userId, chatIds: this.chatIds },
          timestamp: Date.now(),
        });

        // Отправляем накопленные сообщения
        this.flushQueue();
        
        // Запускаем heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('[WS Client] Received:', message.type);
          
          // Вызываем обработчики
          const handlers = this.handlers.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message));
          }
          
          // Универсальный обработчик
          const allHandlers = this.handlers.get('*' as any);
          if (allHandlers) {
            allHandlers.forEach(handler => handler(message));
          }
        } catch (error) {
          console.error('[WS Client] Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS Client] Disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        
        // Переподключаемся если это не намеренное отключение
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS Client] Error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('[WS Client] Connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Отключиться
  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
    
    this.userId = null;
    this.chatIds = [];
    this.reconnectAttempts = 0;
  }

  // Отправить сообщение
  send(message: WSMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      // Добавляем в очередь
      this.messageQueue.push(message);
      return false;
    }
  }

  // Подписаться на тип сообщения
  on(type: WSMessageType | '*', handler: MessageHandler): () => void {
    if (!this.handlers.has(type as WSMessageType)) {
      this.handlers.set(type as WSMessageType, new Set());
    }
    this.handlers.get(type as WSMessageType)!.add(handler);
    
    // Возвращаем функцию отписки
    return () => {
      this.handlers.get(type as WSMessageType)?.delete(handler);
    };
  }

  // Отписаться от типа сообщения
  off(type: WSMessageType | '*', handler: MessageHandler): void {
    this.handlers.get(type as WSMessageType)?.delete(handler);
  }

  // Отправить событие печати
  startTyping(chatId: string, userName?: string) {
    this.send({
      type: 'typing',
      payload: { chatId, userName },
      timestamp: Date.now(),
    });
  }

  // Остановить печать
  stopTyping(chatId: string) {
    this.send({
      type: 'stop_typing',
      payload: { chatId },
      timestamp: Date.now(),
    });
  }

  // Отметить сообщения как прочитанные
  markAsRead(chatId: string, messageIds: string[]) {
    this.send({
      type: 'message_read',
      payload: { chatId, messageIds },
      timestamp: Date.now(),
    });
  }

  // Добавить чат в список
  addChat(chatId: string) {
    if (!this.chatIds.includes(chatId)) {
      this.chatIds.push(chatId);
      
      // Обновляем на сервере
      if (this.userId) {
        this.send({
          type: 'auth',
          payload: { userId: this.userId, chatIds: this.chatIds },
          timestamp: Date.now(),
        });
      }
    }
  }

  // Проверить подключение
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Приватные методы

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[WS Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId, this.chatIds);
      }
    }, Math.min(delay, 30000)); // Максимум 30 секунд
  }

  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Отправляем ping (браузерный WebSocket автоматически отвечает pong)
        // но мы можем отправить кастомный ping
        try {
          this.ws.send(JSON.stringify({
            type: 'ping',
            payload: {},
            timestamp: Date.now(),
          }));
        } catch (error) {
          console.error('[WS Client] Heartbeat error:', error);
        }
      }
    }, 25000); // Каждые 25 секунд
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Синглтон
export const wsClient = new WebSocketClient();
