import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useGroupsStore } from "../components/store/groups.store";

import { useCallback } from "react";

export function useGroupSocket(groupId, currentUserId, messageRefs) {
    const socketRef = useRef(null);

    

    const isChatOpenRef = useRef(false);

    const addMessage = useGroupsStore((s) => s.addMessage);
    //  console.log("addMessage", addMessage);
    const updateReadBy = useGroupsStore((s) => s.updateReadBy);
    const removeMessageLocal = useGroupsStore((s) => s.removeMessageLocal);

    useEffect(() => {
        if (!groupId || !currentUserId) return;

        console.log("render useGroupSocket");
        if (socketRef.current) return; // 🔥 КЛЮЧЕВО
        const token = localStorage.getItem("access");
        const socket = new WebSocket(
            `ws://localhost:8000/ws/group/${groupId}/?token=${token}`
        );

        socketRef.current = socket;

        socket.onopen = () => {
            isChatOpenRef.current = true;
            console.log("WS connected", groupId);

            // 🔥 чат открыт
            socket.send(
                JSON.stringify({
                    type: "chat_open",
                })
            );
        };

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);

            console.log("data", data);
            if (data.type === "message") {
                addMessage(data.message.group, data.message);

                // 👇 ВАЖНО
                if (data.message.sender !== currentUserId) {
                    socket.send(
                        JSON.stringify({
                            type: "messages_read",
                            message_ids: [data.message.id],
                        })
                    );
                }
            }

            if (data.type === "messages.read_update") {
                updateReadBy(data.message_ids, data.user);
            }

            if (data.type === "message.deleted") {
                removeMessageLocal(groupId, data.message_id);
            }

            

            if (data.type === "reply_notification") {
                toast.info(`${data.from_user} ответил на ваше сообщение`, {
                    onClick: () => {
                        const ref =
                            messageRefs.current[data.original_message_id];
                        if (ref?.current) {
                            ref.current.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                            });
                            // добавляем краткую подсветку
                            ref.current.style.background = "#ffff99";
                            setTimeout(
                                () =>
                                    (ref.current.style.background =
                                        "transparent"),
                                1000
                            );
                        }
                    },
                });
            }
        };

        return () => {
            // socket.close();
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, [groupId, currentUserId]);

    return { socket: socketRef.current };
}
