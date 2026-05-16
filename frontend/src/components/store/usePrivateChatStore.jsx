// store/usePrivateChatStore.js
import { create } from "zustand";
import api from "../../api/axios";

export const usePrivateChatStore = create((set, get) => ({
  // ====== CHAT state ======
  messages: [],
  text: "",
  files: [],
  offset: 0,
  hasMore: true,
  LIMIT: 20,

  targetId: null,
  userId: null,
  userName: "",

  // ====== WebSocket refs ======
  wsChat: null,
  wsCall: null,

  // ====== WebRTC state ======
  pc: null,
  localStream: null,
  localVideoEl: null,
  remoteVideoEl: null,

  incomingOffer: null,
  incomingCall: null,       // ⬅ добавлено
  pendingIce: [],

  inCall: false,
  callMode: "audio",


  // =============================
  //          SETTERS
  // =============================
  setTargetId: (id) => set({ targetId: id }),
  setUserId: (id) => set({ userId: id }),
  setUserName: (name) => set({ userName: name }),

  setMessages: (messages) => set({ messages }),
  pushMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  prependMessages: (msgs) => set((s) => ({ messages: [...msgs, ...s.messages] })),

  setText: (t) => set({ text: t }),
  setFiles: (f) => set({ files: f }),

  setHasMore: (v) => set({ hasMore: v }),

  attachLocalVideoEl: (el) => {
    set({ localVideoEl: el });
    if (el && get().localStream) {
      try { el.srcObject = get().localStream; } catch {}
    }
  },

  attachRemoteVideoEl: (el) => {
    set({ remoteVideoEl: el });
  },

  setCallMode: (m) => set({ callMode: m }),

  safeWsSend: (ws, payload) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  },


  // =============================
  //       LOAD MESSAGES
  // =============================
  loadMessages: async (reset = false) => {
    const { LIMIT, offset, targetId } = get();
    try {
      const res = await api.get(
        `/private-chat/?target=${targetId}&limit=${LIMIT}&offset=${reset ? 0 : offset}`
      );

      const newMessages = res.data || [];

      if (reset) {
        set({ messages: newMessages, offset: LIMIT, hasMore: true });
      } else {
        set((s) => ({
          messages: [...newMessages, ...s.messages],
          offset: s.offset + LIMIT,
        }));
      }

      if (newMessages.length < LIMIT) set({ hasMore: false });
    } catch (err) {
      console.error("Ошибка загрузки сообщений:", err);
    }
  },


  // =============================
  //         SEND MESSAGE
  // =============================
  sendMessage: async () => {
    const { text, files, targetId, wsChat } = get();

    if (!text.trim() && (!files || files.length === 0)) return;

    // ---- файлы через API ----
    if (files?.length > 0) {
      const form = new FormData();
      form.append("target", targetId);
      if (text.trim()) form.append("text", text);
      [...files].forEach((f) => form.append("files", f));

      try {
        const res = await api.post("/private-chat/", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        get().safeWsSend(wsChat, {
          type: "message",
          target: targetId,
          message: res.data,
        });

        set((s) => ({
          messages: [...s.messages, res.data],
          text: "",
          files: [],
        }));
      } catch (err) {
        console.error("Ошибка отправки файлов:", err);
      }

      return;
    }

    // ---- текст через WS ----
    get().safeWsSend(wsChat, {
      type: "message",
      target: targetId,
      text: text.trim(),
    });

    set({ text: "" });
  },


  // =============================
  //            INIT
  // =============================
  init: async ({ fetchUserAuthorithized, fetchUser, fetchTotalUnread }) => {
    const currentUserId = await fetchUserAuthorithized();
    if (!currentUserId) return;

    console.log("getCurrent - ", currentUserId);
    set({ userId: currentUserId });

    await get().loadMessages(true);

    try { fetchUser(); } catch {}
    try { fetchTotalUnread(); } catch {}

    // ---- init CALL WS ----
    const ws = new WebSocket(`ws://localhost:8000/ws/call/${currentUserId}/`);
    set({ wsCall: ws });

    ws.onopen = () => console.log("CALL WS OPEN");
    ws.onclose = () => console.log("CALL WS CLOSED");
    ws.onerror = (e) => console.error("CALL WS ERROR", e);

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "offer") {
        set({ incomingOffer: data, incomingCall: data });
        return;
      }

      if (data.type === "answer") {
        const pc = get().pc;
        if (pc?.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(data.sdp);
        }
        return;
      }

      if (data.type === "ice") {
        const pc = get().pc;
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(data.candidate);
        } else {
          set((s) => ({ pendingIce: [...s.pendingIce, data.candidate] }));
        }
      }
    };
  },


  // =============================
  //         CHAT WS INIT
  // =============================
  initChatWs: (userId) => {
    if (!userId) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${userId}/`);
    set({ wsChat: ws });

    ws.onopen = () => console.log("CHAT WS OPEN");
    ws.onerror = (e) => console.error("CHAT WS ERROR", e);
    ws.onclose = () => console.warn("CHAT WS CLOSED");

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "message") {
        set((s) => ({ messages: [...s.messages, data.message] }));
      }
    };
  },


  // =============================
  //         START CALL
  // =============================
  startCall: async () => {
    const { targetId, callMode, wsCall, userId } = get();

    if (!targetId) return;

    // close old pc
    if (get().pc) {
      get().pc.close();
      set({ pc: null });
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        get().safeWsSend(wsCall, {
          type: "ice",
          target: targetId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const el = get().remoteVideoEl;
      if (el) el.srcObject = event.streams[0];
    };

    set({ pc });

    // local media
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callMode === "video",
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    set({ localStream: stream });

    const localEl = get().localVideoEl;
    if (localEl) localEl.srcObject = stream;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    get().safeWsSend(wsCall, {
      type: "offer",
      target: targetId,
      sdp: offer,
      user_id: userId,
      mode: callMode,
    });

    set({ inCall: true });
  },


  // =============================
  //         ACCEPT CALL
  // =============================
  acceptCall: async () => {
    const offer = get().incomingOffer;
    const wsCall = get().wsCall;
    const userId = get().userId;

    if (!offer) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        get().safeWsSend(wsCall, {
          type: "ice",
          target: offer.user_id,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const el = get().remoteVideoEl;
      if (el) el.srcObject = event.streams[0];
    };

    set({ pc });

    // local media
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: offer.mode === "video",
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    set({ localStream: stream });

    const localEl = get().localVideoEl;
    if (localEl) localEl.srcObject = stream;

    await pc.setRemoteDescription(offer.sdp);

    // apply pending ice
    for (const c of get().pendingIce) {
      await pc.addIceCandidate(c);
    }
    set({ pendingIce: [] });

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    get().safeWsSend(wsCall, {
      type: "answer",
      target: offer.user_id,
      sdp: answer,
      user_id: userId,
    });

    set({ incomingOffer: null, incomingCall: null, inCall: true });
  },


  // =============================
  //           END CALL
  // =============================
  endCall: () => {
    try {
      get().localStream?.getTracks().forEach((t) => t.stop());
    } catch {}

    try {
      get().pc?.close();
    } catch {}

    set({
      localStream: null,
      pc: null,
      inCall: false,
    });
  },

  closeSockets: () => {
    get().wsChat?.close?.();
    get().wsCall?.close?.();
    set({ wsChat: null, wsCall: null });
  },
}));
