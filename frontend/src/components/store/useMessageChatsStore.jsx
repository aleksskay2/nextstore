import { create } from "zustand";
import api from "../../api/axios";

import { fetchChatSummary } from "../../api/fetchChatSummary";

// export const useMessageChatsStore = create((set) => ({
//   chats: [],
//   totalUnread: 0,
//   loading: false,

//   loadChats: async () => {
//     set({ loading: true });

//     try {
//       const { data } = await fetchChatSummary();
//       console.log('data - ', data)

//       set({
//         chats: data.chats,
//         totalUnread: data.total_unread,
//         loading: false,
//       });
//     } catch (e) {
//       console.error("Ошибка загрузки чатов", e);
//       set({ loading: false });
//     }
//   },
// }));



// export const useMessageChatsStore = create((set) => ({
//   chats: [],
//   totalUnread: 0,
//   loading: false,

//   loadChats: async () => {
//     set({ loading: true });
//     try {
//       const { data } = await fetchChatSummary();
//       set({
//         chats: data.chats,
//         totalUnread: data.total_unread,
//         loading: false,
//       });
//     } catch (e) {
//       set({ loading: false });
//     }
//   },

//   // 🔥 Мгновенное обновление из сокета
//   updateChatFromSocket: (updatedChat) => {
//     set((state) => {
//       // 1. Ищем, есть ли такой чат уже в списке
//       const existingChatIndex = state.chats.findIndex(c => c.id === updatedChat.id);
      
//       let newChats = [...state.chats];

//       if (existingChatIndex !== -1) {
//         // Обновляем существующий чат
//         newChats[existingChatIndex] = { 
//           ...newChats[existingChatIndex], 
//           ...updatedChat 
//         };
//       } else {
//         // Добавляем новый чат в начало
//         newChats.unshift(updatedChat);
//       }

//       // 2. Сортируем: чат с самым свежим сообщением — наверх
//       newChats.sort((a, b) => 
//         new Date(b.last_message_at) - new Date(a.last_message_at)
//       );

//       // 3. Пересчитываем общий счетчик непрочитанных
//       const newTotalUnread = newChats.reduce((sum, c) => sum + (c.unread_count || 0), 0);

//       return {
//         chats: newChats,
//         totalUnread: newTotalUnread
//       };
//     });
//   }
// }));












export const useMessageChatsStore = create((set, get) => ({
  chats: [],
  totalUnread: 0,
  loading: false,

  // Начальная загрузка (при входе на страницу)
  loadChats: async () => {
    set({ loading: true });
    try {
      // Замени на свой реальный вызов API
      const { data } = await fetchChatSummary(); 
      set({
        chats: data.chats,
        totalUnread: data.total_unread,
        loading: false,
      });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  // 🔥 НОВЫЙ МЕТОД: Обнуление счетчика локально
  markChatAsRead: (chatId, type) => {
    set((state) => {
      const newChats = state.chats.map((c) => {
        // Проверяем соответствие по ID в зависимости от типа чата
        const isTarget = 
          (type === "private" && c.user_id === chatId) ||
          (type === "product" && c.product_id === chatId) ||
          (type === "group" && c.id === chatId);

        if (isTarget) {
          return { ...c, unread_count: 0 };
        }
        return c;
      });

      return {
        chats: newChats,
        totalUnread: newChats.reduce((acc, chat) => acc + (chat.unread_count || 0), 0),
      };
    });
  },


  // 🔥 ОБНОВЛЕНИЕ ЧЕРЕЗ СОКЕТ (Без запроса к API)
  updateChatFromSocket: (updatedChat) => {
    if (!updatedChat) return;

    set((state) => {
      const { chats } = state;
      
      // 1. Пытаемся найти этот чат
      const existingIndex = chats.findIndex((c) => c.id === updatedChat.id);
      
      let newChats = [...chats];

      if (existingIndex !== -1) {
        // Чат уже есть — обновляем поля (текст, время, аватарку, unread)
        newChats[existingIndex] = { 
            ...newChats[existingIndex], 
            ...updatedChat 
        };
      } else {
        // Чата нет — добавляем новый в начало
        newChats.unshift(updatedChat);
      }

      // 2. Сортируем: новые сообщения всегда сверху
      newChats.sort((a, b) => {
        const dateA = new Date(a.last_message_at || 0);
        const dateB = new Date(b.last_message_at || 0);
        return dateB - dateA; // Убывание
      });


      // 3. Пересчитываем общее кол-во непрочитанных
      const newTotalUnread = newChats.reduce((acc, chat) => acc + (chat.unread_count || 0), 0);

      return {
        chats: newChats,
        totalUnread: newTotalUnread,
      };
    });
  },
}));