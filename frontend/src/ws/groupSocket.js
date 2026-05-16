import { useEffect, useRef } from "react";
import { useGroupsStore } from "../store/groups.store";


export function useGroupSocket(groupId) {
  const socketRef = useRef(null);
  const addMessage = useGroupsStore((s) => s.addMessage);

  useEffect(() => {
    if (!groupId) return;

    const socket = new WebSocket(
      `wss://api.example.com/ws/groups/${groupId}/`
    );

    socketRef.current = socket;

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      addMessage(groupId, data);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [groupId]);

  const sendMessage = (text) => {
    if (!socketRef.current || socketRef.current.readyState !== 1) return;

    socketRef.current.send(JSON.stringify({ text }));
  };

  return { sendMessage }; // ✅ ВСЕГДА
}
