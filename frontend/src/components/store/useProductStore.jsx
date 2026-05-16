// store/useProductChatStore.js
import { create } from "zustand";



export const useProductStore = create((set) => ({
  product: null,
  productId: null,

  messages: [],
  receiverId: null,
  currentUserId: null,

  offset: 0,
  limit: 20,
  hasMore: true,
  isConnected: false,

  // ===== setters =====
  setProduct: (product) => set({ product }),
  setProductId: (id) => set({ productId: id }),
  setCurrentUser: (id) => set({ currentUserId: id }),
  setCompanion: (id) => set({ receiverId: id }),

  setMessages: (messages) => set({ messages }),
  appendMessages: (messages) =>
    set((s) => ({ messages: [...s.messages, ...messages] })),
  
 addMessage: (message) =>
  set((s) => {
    const exists = s.messages.find((m) => m.id === message.id);
    if (exists) return s;

    // вычисляем is_own динамически
    const isOwn = message.sender === s.currentUserId;
    return { messages: [...s.messages, { ...message, is_own: isOwn }] };
  }),


  markDelivered: ({ messageId }) => {
  
    set((s) => ({
    messages: s.messages.map((m) =>
      m.id === messageId ? { ...m, is_delivered: true } : m
    ),
  }));
},
  
  






  markRead: (senderId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.sender === senderId ? { ...m, is_read: true } : m
      ),
    })),

  setConnection: (val) => set({ isConnected: val }),
}));


