import { create } from 'zustand';
import { initialChats, initialMessages } from '../data/mockData';
import { generateId } from '../utils/helpers';

export const useChatStore = create((set, get) => ({
  chats: initialChats,
  messages: initialMessages,
  activeChat: null,
  searchQuery: '',
  isSearchOpen: false,
  typingUsers: {},

  setActiveChat: (chatId) => set({ activeChat: chatId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleSearch: () => set(state => ({ isSearchOpen: !state.isSearchOpen })),

  sendMessage: (chatId, text) => {
    const newMessage = {
      id: generateId(),
      chatId,
      senderId: 'me',
      text,
      timestamp: new Date(),
      status: 'sent',
    };

    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = {
        ...state.messages,
        [chatId]: [...chatMessages, newMessage],
      };

      const updatedChats = state.chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: text,
            lastMessageTime: newMessage.timestamp,
          };
        }
        return chat;
      });

      return {
        messages: updatedMessages,
        chats: updatedChats,
      };
    });

    // Simulate message delivery
    setTimeout(() => {
      get().updateMessageStatus(chatId, newMessage.id, 'delivered');
    }, 1000);

    // Simulate message read
    setTimeout(() => {
      get().updateMessageStatus(chatId, newMessage.id, 'read');
    }, 3000);
  },

  updateMessageStatus: (chatId, messageId, status) => {
    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = {
        ...state.messages,
        [chatId]: chatMessages.map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        ),
      };
      return { messages: updatedMessages };
    });
  },

  editMessage: (chatId, messageId, newText) => {
    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = {
        ...state.messages,
        [chatId]: chatMessages.map(msg =>
          msg.id === messageId ? { ...msg, text: newText, edited: true } : msg
        ),
      };
      return { messages: updatedMessages };
    });
  },

  deleteMessage: (chatId, messageId) => {
    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = {
        ...state.messages,
        [chatId]: chatMessages.filter(msg => msg.id !== messageId),
      };
      return { messages: updatedMessages };
    });
  },

  togglePin: (chatId) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
      ),
    }));
  },

  toggleArchive: (chatId) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId ? { ...chat, isArchived: !chat.isArchived } : chat
      ),
    }));
  },

  markAsRead: (chatId) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      ),
    }));
  },

  setTyping: (chatId, isTyping) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: isTyping,
      },
      chats: state.chats.map(chat =>
        chat.id === chatId ? { ...chat, isTyping } : chat
      ),
    }));

    // Auto-clear typing indicator after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        get().setTyping(chatId, false);
      }, 3000);
    }
  },

  getFilteredChats: () => {
    const state = get();
    let chats = state.chats.filter(chat => !chat.isArchived);

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      chats = chats.filter(chat =>
        chat.name.toLowerCase().includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by last message time
    return chats.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
  },
}));
