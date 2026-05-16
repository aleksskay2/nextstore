
const PriceInputs = (minPrice, setMinPrice, maxPrice, setMaxPrice) => {
    return (
          <div className={styles["price-range"]}>
        от
        <div
            className={styles["price-range__min"]}>
            <input
                type="number"
                name="price__max"
                placeholder="Мин"
                value={minPrice}
                onChange={(e) =>
                    setMinPrice(
                        e.target.value
                    )
                }
            />
        </div>
        <div
            className={ styles["price-range__max"]}
        > до
            <input
                type="number"
                name="price__min"
                placeholder="Макс"
                value={maxPrice}
                onChange={(e) =>
                    setMaxPrice(
                        e.target.value
                    )
                }
            />
        </div>
    </div>
    )
}

export default PriceInputs;












// import { useParams, Link } from "react-router-dom";
// import { useEffect, useState, useRef } from "react";

// import styles from "./PrivateChat.module.css";
// import { cn } from "../utils/cn";
// import api from "../api/axios";
// import MessageStatus from "../pages/Message/MessageStatus";
// import DoubleClickImage from "../pages/Message/DoubleClickImage";
// import clip from "../assets/icons/clip.png";
// import messageIcon from "../assets/icons/arrow_message.png";
// import useStore from "./store/store";
// import { useProductFilter } from "./store/UseProductFilter";

// export default function PrivateChat() {
// const { targetId } = useParams();
// const [messages, setMessages] = useState([]);
// const [text, setText] = useState("");
// const [files, setFiles] = useState([]);
// const [offset, setOffset] = useState(0);
// const [hasMore, setHasMore] = useState(true);
// const [userName, setUserName] = useState('');
// const [userId, setUserId] = useState('')

// const chatRef = useRef(null);
// const isInitialScroll = useRef(true);

// // const user = useStore((s) => s.user);
// const LIMIT = 20;

// // WebRTC
// const wsCallRef = useRef(null);
// const wsChatRef = useRef(null);

// const pcRef = useRef(null);
// const localStreamRef = useRef(null);
// const localVideoRef = useRef(null);
// const remoteVideoRef = useRef(null);

// const incomingOfferRef = useRef(null);
// const pendingIceRef = useRef([]); // сюда
// const pendingCandidates = useRef([]);


// const [inCall, setInCall] = useState(false);
// const [incomingCall, setIncomingCall] = useState(null);
// const [callMode, setCallMode] = useState("audio"); // "audio" | "video"

// // ===== LOAD USER =====
// const fetchUser = async () => {
//     try {
//         const res = await api.get(`/users/${targetId}/`);
//         setUserName(res.data.username);
//     } catch (err) {
//         console.error("Ошибка загрузки профиля", err);
//     }
// };

// //  информация о  текущем пользователе.
//    const fetchUserAuthorithized = async () => {
//     try {
//         const response = await api.get('user/');
//         console.log('response', response.data.id);
//         setUserId(response.data.id);
//         return response.data.id;
//     } catch (error) {
//         console.log('error', error);
//         return null;
//     }
//    }

    
//   useEffect(() => {
//     const init = async () => {
//         const currentUserId = await fetchUserAuthorithized();
//         if (!currentUserId) return;

//         console.log("getCurrent - ", currentUserId);

//         await loadMessages(true);
//         fetchUser();
//         fetchTotalUnread();

//         // WebSocket init for calls
//         const ws = new WebSocket(`ws://localhost:8000/ws/call/${currentUserId}/`);
//         wsCallRef.current = ws;

//         ws.onopen = () => console.log("CALL WS OPEN");
//         ws.onclose = () => console.log("CALL WS CLOSED");
//         ws.onerror = (e) => console.error("CALL WS ERROR", e);

     

// wsCallRef.current.onmessage = async (event) => {
//     const data = JSON.parse(event.data);

//     if (data.type === "offer") {
//         incomingOfferRef.current = data; // сохраняем offer
//         setIncomingCall(data); // для UI
//     }
//     else if (data.type === "answer") {
//     console.log("ANSWER received. Current state:", pcRef.current?.signalingState);

//     if (pcRef.current?.signalingState === "have-local-offer") {
//         await pcRef.current.setRemoteDescription(data.sdp);
//         console.log("Remote ANSWER applied");
//     } else {
//         console.warn(
//             "Ignored ANSWER — wrong state:",
//             pcRef.current?.signalingState
//         );
//     }
// }
//     else if (data.type === "ice") {
//         if (pcRef.current?.remoteDescription) {
//             await pcRef.current.addIceCandidate(data.candidate);
//         } else {
//             console.log("ICE отложен — remoteDescription еще нет");
//             pendingIceRef.current.push(data.candidate);
//         }
//     }
// };

//     };

//     init();

//     return () => wsCallRef.current?.close();
// }, []); // init только один раз





// useEffect(() => {
//     if (!userId || !userId) return;

//     const ws = new WebSocket(`ws://localhost:8000/ws/chat/${userId}/`);
//     wsChatRef.current = ws;

//     ws.onopen = () => console.log("CHAT WS OPEN");
//     ws.onmessage = (e) => {
//         const data = JSON.parse(e.data);
//         if (data.type === "message") {
//             setMessages(prev => [...prev, data.message]);
//             scrollToBottom();
//         }
//     };
//     ws.onerror = (e) => console.error("CHAT WS ERROR", e);
//     ws.onclose = () => console.warn("CHAT WS CLOSED");

//     return () => ws.close();
// }, [userId]);



// const fetchTotalUnread = useProductFilter(s => s.fetchTotalUnread);


// // ===== MESSAGES =====
// const handleScroll = () => {
//     if (chatRef.current.scrollTop === 0 && hasMore) {
//         loadMessages(false);
//     }
// };

// useEffect(() => {
//     if (isInitialScroll.current) {
//         scrollToBottom();
//         isInitialScroll.current = false;
//     }
// }, [messages]);

// const scrollToBottom = () => {
//     if (!chatRef.current) return;
//     chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
// };

// const loadMessages = async (reset = false) => {
//     try {
//         const res = await api.get(
//             `/private-chat/?target=${targetId}&limit=${LIMIT}&offset=${reset ? 0 : offset}`
//         );
//         const newMessages = res.data || [];
//         if (reset) {
//             setMessages(newMessages);
//             setOffset(LIMIT);
//             isInitialScroll.current = true;
//         } else {
//             setMessages(prev => [...newMessages, ...prev]);
//             setOffset(prev => prev + LIMIT);
//             setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = 10; }, 10);
//         }
//         if (newMessages.length < LIMIT) setHasMore(false);
//     } catch (error) {
//         console.error("Ошибка загрузки личных сообщений:", error);
//     }
// };



// const sendMessage = async () => {
//     if (!text.trim() && files.length === 0) return;

//     // === если есть файлы — отправляем через API ===
//     if (files.length > 0) {
//         const form = new FormData();
//         form.append("target", targetId);
//         if (text.trim()) form.append("text", text);
//         for (let f of files) form.append("files", f);

//         const res = await api.post("/private-chat/", form, {
//             headers: { "Content-Type": "multipart/form-data" }
//         });

//         // отправляем по WebSocket чтобы другой пользователь получил мгновенно
//         wsChatRef.current.send(JSON.stringify({
//             type: "message",
//             target: targetId,
//             message: res.data,
//         }));

//         setMessages(prev => [...prev, res.data]);
//         setText("");
//         setFiles([]);
//         scrollToBottom();
//         return;
//     }

//     // === текст без файлов — сразу WebSocket ===
//     wsChatRef.current.send(JSON.stringify({
//         type: "message",
//         target: targetId,
//         text: text.trim(),
//     }));

//     setText("");
// };








// // ================================================================
// // ================      WEBRTC AUDIO / VIDEO      ================
// // ================================================================
// const createPeerConnection = (remoteUserId) => {
//     if (pcRef.current) {
//         // если уже есть — не пересоздаём
//         return;
//     }

//     pcRef.current = new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//     });

//     pcRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//             if (wsCallRef.current && wsCallRef.current.readyState === WebSocket.OPEN) {
//                 wsCallRef.current.send(JSON.stringify({
//                     type: "ice",
//                     target: remoteUserId,
//                     candidate: event.candidate
//                 }));
//             }
//         }
//     };

//     pcRef.current.ontrack = (event) => {
//         if (remoteVideoRef.current) {
//             remoteVideoRef.current.srcObject = event.streams[0];
//         }
//     };

//     // если до создания pc приходили ICE — применяем их
//     if (pendingIceRef.current.length > 0) {
//         pendingIceRef.current.forEach(async (c) => {
//             try {
//                 await pcRef.current.addIceCandidate(c);
//             } catch (err) {
//                 console.warn("Ошибка при добавлении отложенного ICE", err);
//             }
//         });
//         pendingIceRef.current = [];
//     }
// };


// const startCall = async () => {
//     // Если pcRef.current уже есть, закрываем старый
//     if (pcRef.current) {
//         pcRef.current.close();
//     }

//     pcRef.current = new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//     });

//     // Обработка ICE
//     pcRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//             wsCallRef.current.send(JSON.stringify({
//                 type: "ice",
//                 target: targetId,
//                 candidate: event.candidate
//             }));
//         }
//     };

//     pcRef.current.ontrack = (event) => {
//         if (remoteVideoRef.current) {
//             remoteVideoRef.current.srcObject = event.streams[0];
//         }
//     };

//     // Получаем локальный поток
//     localStreamRef.current = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: callMode === "video"
//     });



    
//     // Добавляем треки в новый PeerConnection
//     localStreamRef.current.getTracks().forEach(track =>
//         pcRef.current.addTrack(track, localStreamRef.current)
//     );

//     if (localVideoRef.current) {
//         localVideoRef.current.srcObject = localStreamRef.current;
//     }

//     const offer = await pcRef.current.createOffer();
//     await pcRef.current.setLocalDescription(offer);

//     wsCallRef.current.send(JSON.stringify({
//         type: "offer",
//         target: targetId,
//         sdp: offer,
//         user_id: userId,
//         mode: callMode
//     }));

//     setInCall(true);
// };


// function waitForState(targetState) {
//     return new Promise(resolve => {
//         const interval = setInterval(() => {
//             if (pcRef.current.signalingState === targetState) {
//                 clearInterval(interval);
//                 resolve();
//             }
//         }, 50);
//     });
// }




// const acceptCall = async () => {
//     const offer = incomingOfferRef.current;
//     if (!offer) {
//         console.warn("Waiting for remote offer...");
//         return;
//     }

//     console.log("ACCEPT CALL");

//     pcRef.current = new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//     });

//     pcRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//             wsCallRef.current.send(JSON.stringify({
//                 type: "ice",
//                 target: offer.user_id,
//                 candidate: event.candidate
//             }));
//         }
//     };

//     pcRef.current.ontrack = (event) => {
//         if (remoteVideoRef.current) {
//             remoteVideoRef.current.srcObject = event.streams[0];
//         }
//     };

//     // локальный поток
//     localStreamRef.current = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: offer.mode === "video"
//     });

//     localStreamRef.current.getTracks().forEach(track =>
//         pcRef.current.addTrack(track, localStreamRef.current)
//     );

//     if (localVideoRef.current) {
//         localVideoRef.current.srcObject = localStreamRef.current;
//     }

//     // ставим удалённое описание (offer)
//     await pcRef.current.setRemoteDescription(offer.sdp);

//     // добавляем отложенные ICE
//     pendingIceRef.current.forEach(async candidate => {
//         await pcRef.current.addIceCandidate(candidate);
//     });
//     pendingIceRef.current = [];

//     // создаём answer
//     const answer = await pcRef.current.createAnswer();
//     await pcRef.current.setLocalDescription(answer);

//     wsCallRef.current.send(JSON.stringify({
//         type: "answer",
//         target: offer.user_id,
//         sdp: answer,
//         user_id: userId,
//     }));

//     incomingOfferRef.current = null;
//     setIncomingCall(null);
//     setInCall(true);
// };










// const endCall = () => {
//     localStreamRef.current?.getTracks().forEach(t => t.stop());
//     pcRef.current?.close();
//     setInCall(false);
// };


// // ================================================================
// // =======================  RENDER  ===============================
// // ================================================================
// return (
//     <div className={styles["chat__wrapper"]}>
//         <div className={styles["chat__container"]}>
//             <h2 className={styles["chat__title"]}>
//                 Чат с <Link to={`/user/${targetId}`}>{userName}</Link>

//                 {/* Выбор режима звонка */}
//                 <select
//                     value={callMode}
//                     onChange={(e) => setCallMode(e.target.value)}
//                     style={{ marginLeft: 20 }}
//                 >
//                     <option value="audio">Аудио</option>
//                     <option value="video">Видео</option>
//                 </select>

//                 <button onClick={startCall} style={{ marginLeft: 10 }}>Позвонить</button>
//             </h2>

//             {incomingCall && (
//                 <div style={{ background: "#ffeeba", padding: 10, marginBottom: 10 }}>
//                     Входящий {incomingCall.mode === "video" ? "видеозвонок" : "аудиозвонок"}...
//                     <button onClick={acceptCall} style={{ marginLeft: 10 }}>Принять</button>
//                 </div>
//             )}

//             <div className={styles["chat"]} ref={chatRef} onScroll={handleScroll}>
//                 {messages.map(msg => (
//                     <div key={msg.id}>
//                         <div className={styles["chat__date"]}>
//                             <small>{new Date(msg.created_at).toLocaleDateString()}</small>
//                         </div>

//                         <div className={`${styles.chat__message} ${msg.is_own ? styles.own : styles.other}`}>
//                             <div className={`${styles.chat__text} ${msg.is_own ? styles["color-text"] : styles.sender}`}>
//                                 {msg.text}
//                                 {msg.images?.length > 0 &&
//                                     msg.images.map(img => <DoubleClickImage key={img.id} src={img.image} />)}
//                                 <MessageStatus isRead={msg.is_read} />
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             <div className={cn(styles.chat__send, styles.send)}>
//                 <div className={styles["send__clip"]}>
//                     <input id="inputFile" multiple type="file" accept="image/*" onChange={(e) => setFiles(e.target.files)} />
//                     <label htmlFor="inputFile"><img src={clip} alt="" /></label>
//                 </div>

//                 <div className={styles["input__message"]}>
//                     <input
//                         name="message_text"
//                         type="text"
//                         value={text}
//                         onChange={(e) => setText(e.target.value)}
//                         placeholder="Введите сообщение..."
//                         onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//                     />
//                 </div>

//                 <div className={styles["send__message"]}>
//                     <button onClick={sendMessage}><img src={messageIcon} alt="" /></button>
//                 </div>
//             </div>
//         </div>

//         {inCall && (
//             <div style={{ padding: 10, background: "#000", color: "#fff" }}>
//                 <h3>Звонок</h3>

//                 <div style={{ display: "flex", gap: 20 }}>
//                     <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 200 }} />
//                     <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 200 }} />
//                 </div>

//                 <button style={{ marginTop: 10 }} onClick={endCall}>Завершить звонок</button>
//             </div>
//         )}
//     </div>
// );
// }


