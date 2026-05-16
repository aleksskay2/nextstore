import { create } from "zustand";
import api from "../../api/axios";

export const useChatStore = create((set, get) => ({
    messages: [],
    offset: 0,
    hasMore: true,
    wsChatRef:null ,

      // 🔥 TEXT INPUT
    text: "",

    
    replyMessage: null, // 🔥 Обязательно инициализируем
    selectedMessage: null,


    setWsChatRef: (ws) => set({ wsChatRef: ws }),

    setText: (value) => set({ text: value }),
    clearText: () => set({ text: "" }),


    setMessages: (fn) =>
        set(state => ({
            messages: typeof fn === "function" ? fn(state.messages) : fn
        })),

    setOffset: (fn) =>
        set(state => ({
            offset: typeof fn === "function" ? fn(state.offset) : fn
        })),

    // ... твои остальные функции ...

    setSelectedMessage: (msg) => set({ selectedMessage: msg }),
    clearSelectedMessage: () => set({ selectedMessage: null }),

    setReplyMessage: (msg) => set({ replyMessage: msg }), 
    clearReplyMessage: () => set({ replyMessage: null }), // 🔥 Добавляем очистку

    

    setHasMore: (value) => set({ hasMore: value }),

    setDelivered: (messageId) =>
    set(state => ({
        messages: state.messages.map(m =>
        m.id === messageId ? { ...m, is_delivered: true } : m
        )
    }))
    ,



    loadMessages: async ({
        targetId,
        LIMIT,
        reset = false,
        onAfterLoad, // 👈 callback из компонента
    }) => {
        try {
            const { offset, messages } = get();

            const res = await api.get(
                `/private-chat/?target=${targetId}&limit=${LIMIT}&offset=${reset ? 0 : offset}`
            );

            console.log('res data in useChatStore', res.data)

            const newMessages = res.data || [];

            set(state => {
                const merged = reset
                    ? newMessages
                    : [...newMessages, ...state.messages];

                const unique = Array.from(
                    new Map(merged.map(m => [m.id, m])).values()
                );

                return { messages: unique };
            });

            if (reset) {
                set({ offset: LIMIT });
            } else {
                set(state => ({ offset: state.offset + LIMIT }));
            }

            if (newMessages.length < LIMIT) {
                set({ hasMore: false });
            }

            // 👇 даём компоненту сделать scroll / refs
            onAfterLoad?.({ reset });

        } catch (error) {
            console.error("Ошибка загрузки личных сообщений:", error);
        }
    },

    deleteMessageForAll: async (messageId) => {
    try {
        await api.delete(`/private-chat/${messageId}/delete-for-all/`);

        // 🔥 оптимистично удаляем из стора
        set(state => ({
            messages: state.messages.filter(m => m.id !== messageId)
        }));
    } catch (error) {
        console.error("Ошибка удаления сообщения:", error);
    }
},


    
}));
