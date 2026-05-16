// src/store/useRegionChatStore.js
import { create } from "zustand";
import api from "../../api/axios";


let socket = null;

export const useRegionChatStore = create((set, get) => ({
    // ================= STATE =================
    messages: [],
    text: "",
    region: null,
    page: 1,
    hasNext: true,
    files: [],
    filePreviews: [],
    isConnected: false,

    // ================= SOCKET =================
    connectSocket: (regionId) => {
        const token = localStorage.getItem("access");
        if (!token) return;

        // Если сокет уже открыт, закрываем старый
        if (socket) {
            socket.close();
        }
        
        const targetRegion = (regionId === '' || regionId === null) ? 0 : regionId;
        
        socket = new WebSocket(`ws://localhost:8000/ws/region/${targetRegion}/?token=${token}`);

        set({ region: targetRegion });

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
           
          

            console.log("📩 WS Message:", data); // Для отладки
           
            if (data.type === "new_message") {
                // Добавляем сообщение в конец списка
                set((state) => ({
                    messages: [...state.messages, data.message]
                }));
            }

            if (data.type === "messages_read") {
                set((state) => ({
                    messages: state.messages.map((m) => ({ ...m, is_read: true })),
                }));
            }
        };

        socket.onopen = () => {
            console.log("✅ WS region Connected");
            set({ isConnected: true });
        };

        socket.onclose = () => {
            console.log("❌ WS Closed");
            set({ isConnected: false });
        };

        socket.onerror = (err) => console.error("WS Error:", err);
    },

    // ЭТОЙ ФУНКЦИИ НЕ ХВАТАЛО
    disconnectSocket: () => {
        if (socket) {
            socket.close();
            socket = null;
        }
        set({ isConnected: false });
    },

    // ================= CHAT ACTIONS =================
  
    setText: (val) => set({ text: val }),

    // ИСПРАВЛЕНО: Теперь поддерживает и просто значение, и функцию (prev => ...)
    setFiles: (val) => set((state) => ({
        files: typeof val === 'function' ? val(state.files) : val
    })),

    // ДОБАВЛЕНО/ИСПРАВЛЕНО: Чтобы работал выбор файлов через инпут
    setFilesWithPreview: (fileList) => {
        const selectedFiles = Array.from(fileList);
        const newPreviews = selectedFiles.map(file => ({
            url: URL.createObjectURL(file),
            file: file
        }));

        set((state) => ({
            files: [...state.files, ...selectedFiles],
            filePreviews: [...state.filePreviews, ...newPreviews]
        }));
    },

    // ДОБАВЛЕНО: Удаление превью
    removePreview: (url) => set((state) => ({
        files: state.files.filter((_, i) => state.filePreviews[i].url !== url),
        filePreviews: state.filePreviews.filter(p => p.url !== url)
    })),

    sendMessage: async (regionId, replyToId = null) => {
        const { text, files } = get();
        if (!text.trim() && files.length === 0) return;

        const form = new FormData();
        form.append("region", regionId || 0);
        form.append("text", text);
        if (replyToId) form.append("reply_to", replyToId);

        // Теперь files точно массив, и ошибка TypeError исчезнет
        if (Array.isArray(files)) {
            files.forEach(file => form.append("uploaded_files", file));
        }

        try {
            await api.post("/region-chat/", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            // Очистка
            set({ text: "", files: [], filePreviews: [] });
        } catch (e) {
            console.error("Ошибка отправки", e);
        }
    },
// ...


    // ================= HISTORY =================
    loadMessages: async (regionId, page = 1) => {
        const targetRegion = (regionId === '' || regionId === null) ? "" : regionId;
        
        try {
            const res = await api.get("/region-chat/", {
                params: { region: targetRegion, page },
            });

            console.log('res regMessages', res.data)
            // Для чата: если страница 1 — заменяем сообщения, если > 1 — добавляем ВВЕРХ
            // .reverse() используем только если бэкенд отдает новые сверху (descending)
            // ВАЖНО: DRF обычно возвращает { results: [...] }
            const rawData = res.data.results || res.data; 
            const newMessages = [...rawData]; // Переворачиваем для хронологии

            set((state) => ({
                messages: page === 1 ? newMessages : [...newMessages, ...state.messages],
                page,
                hasNext: !!res.data.next,
            }));
        } catch (e) {
            console.error("Ошибка загрузки сообщений", e);
        }
    },

    loadNextPage: async () => {
        const { region, page, hasNext } = get();
        if (!hasNext) return;
        await get().loadMessages(region, page + 1);
    },

    markRead: async () => {
        const { region } = get();
        if (!region) return;

        try {
            await api.post("/region-chat/mark-read/", { region });
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "mark_read" }));
            }
        } catch (e) {
            console.error("Ошибка mark_read", e);
        }
    },

    // ================= FILES =================
    setFilesWithPreview: (files) => {
        const fileArray = Array.from(files);
        const previews = fileArray.map((f) => ({
            file: f,
            url: URL.createObjectURL(f),
        }));

        set((state) => ({
            files: [...state.files, ...fileArray],
            filePreviews: [...state.filePreviews, ...previews],
        }));
    },

    removePreview: (url) =>
        set((state) => {
            const index = state.filePreviews.findIndex((p) => p.url === url);
            if (index === -1) return state;

            return {
                filePreviews: state.filePreviews.filter((p) => p.url !== url),
                files: state.files.filter((_, i) => i !== index),
            };
        }),
}));