import { useEffect, useRef } from 'react';
import { useChatStore } from '../components/store/useChatStore';
import { useAppStore } from '../components/store/appStore';   // глобальный стор для wsRef

export const usePrivateSocket = (currentUserId, targetId) => {
    const { setMessages, setWsChatRef } = useChatStore();
    const wsRef = useRef(null);

    useEffect(() => {
        if (!currentUserId) return;

        // Инициализация сокета
        const ws = new WebSocket(`ws://localhost:8000/ws/chat/${currentUserId}/`);
        wsRef.current = ws;
        setWsChatRef(ws); // Сохраняем в стор для доступа извне (например, из сторис)

        ws.onopen = () => {
            console.log("CHAT WS OPEN");
            if (targetId) {
                ws.send(JSON.stringify({ type: "chat_open", target: targetId }));
            }
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            
            if (data.type === "message") {
                const isOwn = Number(data.message.sender) === Number(currentUserId);
                setMessages((prev) => {
                    if (prev.some((m) => m.id === data.message.id)) return prev;
                    return [...prev, { ...data.message, is_own: isOwn }];
                });
            }

            if (data.type === "delivered") {
                setMessages((prev) =>
                    prev.map((m) => m.id === data.message_id ? { ...m, is_delivered: true } : m)
                );
            }

            if (data.type === "read") {
                setMessages((prev) =>
                    prev.map((m) => data.message_ids.includes(m.id) ? { ...m, is_read: true } : m)
                );
            }
        };

        return () => {
            ws.close();
            setWsChatRef(null);
        };
    }, [currentUserId, targetId, setMessages, setWsChatRef]);

    return wsRef;
};