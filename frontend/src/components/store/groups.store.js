import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../../api/axios";

export const useGroupsStore = create(
  persist(
    (set, get) => ({
      groups: [],
      activeGroup: null,
      messages: {},
      
      membersCount :null,
      
      setMembersCount:(count) => set (
        {membersCount:count}
      )
      ,
      
      openReadedLists :false,
      setOpenReadedLists:(open) => set(
        {openReadedLists:open}
      ),


      replyMessage: null,
      setReplyMessage: (msg) => set({ replyMessage: msg }),
      clearReplyMessage: () => set({ replyMessage: null }),



      // ✅ НОВОЕ
      // selectedMessageId: null,

      // setSelectedMessage: (messageId) =>
      //   set({ selectedMessageId: messageId }),

      // clearSelectedMessage: () =>
      //   set({ selectedMessageId: null }),


      selectedMessage: null,

      setSelectedMessage: (message) =>
        set({ selectedMessage: message }),

      clearSelectedMessage: () =>
        set({ selectedMessage: null }),


      setGroups: (groups) => set({ groups }),

      setActiveGroup: (group) => set({ activeGroup: group }),

      clearActiveGroup: () =>
        set({ activeGroup: null }),


      addMessage: (groupId, message) => {
        const current = get().messages[groupId] || [];

        // ❗ защита от дублей по id
        if (current.some((m) => m.id === message.id)) {
          return;
        }

        set({
          messages: {
            ...get().messages,
            [groupId]: [...current, message],
          },
        });
      },


      setMessages: (groupId, messages) => {
        set({
          messages: {
            ...get().messages,
            [groupId]: messages,
          },
        });
      },

  


updateReadBy: (messageIds, user) =>
  set((state) => {
    const newMessages = {};
    let newSelectedMessage = state.selectedMessage;

    for (const groupId in state.messages) {
      newMessages[groupId] = state.messages[groupId].map((msg) => {
        if (!messageIds.includes(msg.id)) return msg;

        const existing = msg.read_by_users || [];
        if (existing.includes(user.username)) return msg;

        const updatedMsg = {
          ...msg,
          read_by_users: [...existing, user.username],
        };

        // 🔥 если это выбранное сообщение — обновляем и его
        if (state.selectedMessage?.id === msg.id) {
          newSelectedMessage = updatedMsg;
        }

        return updatedMsg;
      });
    }

    return {
      messages: newMessages,
      selectedMessage: newSelectedMessage,
    };
  }),




//   deleteMessage: async (groupId, messageId) => {
//   // Локально
//   set((state) => ({
//     messages: {
//       ...state.messages,
//       [groupId]: state.messages[groupId].filter(m => m.id !== messageId),
//     },
//     selectedMessage: state.selectedMessage?.id === messageId ? null : state.selectedMessage,
//   }));

//   try {
//     await api.delete(`group-messages/${messageId}/`);
//   } catch (err) {
//     console.error("Ошибка удаления сообщения", err);
//   }
// },


removeMessageLocal: (groupId, messageId) => {
  const normalizedMessageId = Number(messageId);

  set((state) => {
    const groupMessages = state.messages[groupId] || [];

    return {
      messages: {
        ...state.messages,
        [groupId]: groupMessages.filter(
          (m) => m.id !== normalizedMessageId
        ),
      },
      selectedMessage:
        state.selectedMessage?.id === normalizedMessageId
          ? null
          : state.selectedMessage,
    };
  });
},

  





    }),
    {
      name: "groups-store", // ключ в localStorage
      partialize: (state) => ({
        activeGroup: state.activeGroup,
      }),
    }
  )
);
