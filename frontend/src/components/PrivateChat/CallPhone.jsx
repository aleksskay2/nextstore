

const PrivateChat = () => {
  const { targetId } = useParams();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const pendingCandidates = useRef([]);
  const localStreamRef = useRef(null);

  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  /* ================= INIT ================= */

  useEffect(() => {
    const init = async () => {
      const response = await api.get("user/");
      const userId = response.data.id;

      wsRef.current = new WebSocket(
        `ws://localhost:8000/ws/call/${userId}/`
      );

      wsRef.current.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "offer") setIncomingCall(data);
  if (data.type === "answer") await handleAnswer(data);
  if (data.type === "ice-candidate") handleNewICECandidate(data);

  if (data.type === "call-ended") {
    console.log("📴 Call ended by remote");
    endCall(false); // ❗ не отправляем обратно
  }
};

    };

    init();

    return () => {
      wsRef.current?.close();
      pcRef.current?.close();
      
      stopLocalStream();
    };
  }, [targetId]);



  /* ================= MEDIA ================= */

  const getLocalStream = async (type) => {
    if (localStreamRef.current) return localStreamRef.current;

    const constraints =
      type === "video"
        ? { video: true, audio: true }
        : { video: false, audio: true };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;

    // 🔥 ПРИВЯЗЫВАЕМ LOCAL VIDEO
    if (type === "video" && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  /* ================= PEER ================= */

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(configuration);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(JSON.stringify({
          type: "ice-candidate",
          target: targetId,
          candidate: event.candidate,
        }));
      }
    };

    return pc;
  };




  /* ================= CALL FLOW ================= */

  const startCall = async (type) => {
    const stream = await getLocalStream(type);
    pcRef.current = createPeerConnection(stream);

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    wsRef.current.send(JSON.stringify({
      type: "offer",
      target: targetId,
      sdp: offer.sdp,
    }));

    setCallActive(true);
  };

  const acceptCall = async (type) => {
    const stream = await getLocalStream(type);
    pcRef.current = createPeerConnection(stream);

    await pcRef.current.setRemoteDescription({
      type: "offer",
      sdp: incomingCall.sdp,
    });

    for (const c of pendingCandidates.current) {
      await pcRef.current.addIceCandidate(c);
    }
    pendingCandidates.current = [];

    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);

    wsRef.current.send(JSON.stringify({
      type: "answer",
      target: incomingCall.from,
      sdp: answer.sdp,
    }));

    setIncomingCall(null);
    setCallActive(true);
  };

  

  const handleAnswer = async (data) => {
    if (pcRef.current?.signalingState === "have-local-offer") {
      await pcRef.current.setRemoteDescription({
        type: "answer",
        sdp: data.sdp,
      });
    }
  };

  const handleNewICECandidate = async (data) => {
    if (pcRef.current?.remoteDescription) {
      await pcRef.current.addIceCandidate(data.candidate);
    } else {
      pendingCandidates.current.push(data.candidate);
    }
  };

  const endCall = (sendSignal = true) => {
  if (sendSignal && wsRef.current) {
    wsRef.current.send(JSON.stringify({
      type: "call-ended",
      target: targetId,
    }));
  }

  pcRef.current?.close();
  pcRef.current = null;

  stopLocalStream();

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
  }

  setCallActive(false);
  setIncomingCall(null);
};


  /* ================= UI ================= */

  return (
    <div style={{ margin: "100px" }}>
      {!callActive && !incomingCall && (
        <>
          <button onClick={() => startCall("video")}>Позвонить (Видео)</button>
          <button onClick={() => startCall("audio")}>Позвонить (Аудио)</button>
        </>
      )}

      {!callActive && incomingCall && (
        <>
          <button onClick={() => acceptCall("video")}>Принять Видео</button>
          <button onClick={() => acceptCall("audio")}>Принять Аудио</button>
        </>
      )}

      {callActive && <button onClick={endCall}>Завершить</button>}

      {/* 🎥 LOCAL */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "200px", background: "#222", marginRight: "20px" }}
      />

      {/* 🎥 REMOTE */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: "400px", background: "black" }}
      />
    </div>
  );
};

export default PrivateChat;














// import { useParams, Link } from "react-router-dom";
// import { useEffect, useState, useRef } from "react";

// import styles from "./PrivateChat.module.css";
// import { cn } from "../../utils/cn";
// import api from "../../api/axios";

// import useStore from "../store/store";
// import { useProductFilter } from "../store/UseProductFilter";
// import { useChatStore } from "../store/useChatStore";

// import ChatHeader from "./ChatHeader"
// import ChatMessages from "./ChatMessages";
// import ChatInput from "./ChatInput"
// import CallModal from "./CallModal";

// const PrivateChat = () => {
//     const { targetId } = useParams();
//     // const [messages, setMessages] = useState([]);
//     // const [text, setText] = useState("");

//     const text = useChatStore(state => state.text);
//     const setText = useChatStore(state => state.setText);
//     const clearText = useChatStore(state => state.clearText);


//     const [files, setFiles] = useState([]);
//     // const [hasMore, setHasMore] = useState(true);
//     const [userName, setUserName] = useState('');
//     const [userId, setUserId] = useState('')

//     const chatRef = useRef(null);
//     const isInitialScroll = useRef(true);
//     const remoteAudioRef = useRef(null);

//     // const user = useStore((s) => s.user);
//     const LIMIT = 20;

//     // WebRTC
//     const wsCallRef = useRef(null);
//     const wsChatRef = useRef(null);

//     const pcRef = useRef(null);
//     const localStreamRef = useRef(null);
//     const localVideoRef = useRef(null);
//     const remoteVideoRef = useRef(null);
//     const incomingOfferRef = useRef(null);
//     const pendingIceRef = useRef([]); // сюда
//     const remoteStreamRef = useRef(null);


//     const [inCall, setInCall] = useState(false);
//     const [incomingCall, setIncomingCall] = useState(null);
//     const [callMode, setCallMode] = useState("audio"); // "audio" | "video"
//     const [previews, setPreviews] = useState([]);


//     const {
//         messages,
//         loadMessages,
//         hasMore,
//         setMessages,
//     } = useChatStore();




//     // ===== LOAD USER =====
//     const fetchUser = async () => {
//         try {
//             const res = await api.get(`/users/${targetId}/`);
//             setUserName(res.data.username);
//         } catch (err) {
//             console.error("Ошибка загрузки профиля", err);
//         }
//     };

//     //  информация о  текущем пользователе.
//     const fetchUserAuthorithized = async () => {
//         try {
//             const response = await api.get('user/');
//             console.log('response', targetId, response.data.id);
           
//             setUserId(Number(response.data.id));
//             return response.data.id;
//         } catch (error) {
//             console.log('error', error);
//             return null;
//         }
//     }

        


// useEffect(() => {
//     let ws;

//     const init = async () => {
//         const currentUserId = await fetchUserAuthorithized();
//         if (!currentUserId) return;


//         console.log('currentUserId -', currentUserId)
//         ws = new WebSocket(`ws://localhost:8000/ws/chat/${currentUserId}/`);
//         wsChatRef.current = ws;

//         ws.onopen = () => {
//             console.log("CHAT WS OPEN");

//             if (targetId) {
//                 ws.send(JSON.stringify({
//                     type: "chat_open",
//                     target: targetId
//                 }));
//             }
//         };

//         ws.onmessage = (e) => {
//             const data = JSON.parse(e.data);

//             console.log("WS messageEvent EVENT:", e.data);

//             // ======================
//             // НОВОЕ СООБЩЕНИЕ
//             // ======================
//             if (data.type === "message") {
             
//                 let isOwn = Number(data.message.sender_id) === Number(currentUserId);
//                 if (!data.message.sender_id) isOwn = true;
//                 console.log('isOwn - ', isOwn)
//                 console.log('data.message.sender_id - ', data.message.sender_id)

//                 setMessages(prev => {
//                     const exists = prev.find(m => m.id === data.message.id);
//                     // если сообщение уже есть — ОБНОВЛЯЕМ
//                     if (exists ) {
//                         return prev.map(m =>
//                             m.id === data.message.id
//                                 ? { ...m, ...data.message, is_own: isOwn }
//                                 : m
//                         );
//                     }

//                     // если нового ещё не было — добавляем
//                     return [...prev, { ...data.message, is_own: isOwn }];
//                 });


//                 scrollToBottom();

                
//             }

//             // ======================
//             // ДОСТАВЛЕНО (серые галочки)
//             // ======================
//             if (data.type === "delivered") {
//                 setMessages(prev =>
//                     prev.map(m =>
//                         m.id === data.message_id
//                             ? { ...m, is_delivered: true }
//                             : m
//                     )
//                 );
//             }

//             // ======================
//             // ПРОЧИТАНО (синие галочки)
//             // ======================
//             if (data.type === "read") {
//                 console.log("🔥 READ EVENT:", data);

//                 setMessages(prev =>
//                     prev.map(m =>
//                         data.message_ids.includes(m.id)
//                             ? { ...m, is_read: true }
//                             : m
//                     )
//                 );
//             }


//         };

//         ws.onerror = (e) => console.error("CHAT WS ERROR", e);
//         ws.onclose = () => console.warn("CHAT WS CLOSED");
//     };

//     init();

//     return () => ws?.close();
// }, []);


// const callWsInitialized = useRef(false);

// useEffect(() => {
//     if (!userId) return;
//     if (callWsInitialized.current) return;

//     callWsInitialized.current = true;

//     let ws;

//     const init = async () => {
//         const currentUserId = await fetchUserAuthorithized();
//         if (!currentUserId) return;

//         fetchUser();
//         fetchTotalUnread();

//         ws = new WebSocket(`ws://localhost:8000/ws/call/${currentUserId}/`);
//         wsCallRef.current = ws;

//         ws.onopen = () => console.log("CALL WS OPEN");
//         ws.onclose = () => console.log("CALL WS CLOSED");
//         ws.onerror = (e) => console.error("CALL WS ERROR", e);

//         ws.onmessage = async (event) => {
//             const data = JSON.parse(event.data);

//             if (data.type === "offer") {
//                 incomingOfferRef.current = data;
//                 setIncomingCall(data);
//             }

//             else if (data.type === "answer") {
//                 const pc = pcRef.current;
//                 if (!pc) return;

//                 if (pc.signalingState !== "have-local-offer") {
//                     console.warn("Ignored answer, state:", pc.signalingState);
//                     return;
//                 }

//                 await pc.setRemoteDescription(
//                     new RTCSessionDescription(data.sdp)
//                 );

//                 await applyPendingIce();
//             }

//             else if (data.type === "ice") {
//                 if (!pcRef.current) return;

//                 if (pcRef.current.remoteDescription) {
//                     await pcRef.current.addIceCandidate(data.candidate);
//                 } else {
//                     pendingIceRef.current.push(data.candidate);
//                 }
//             }


//             if (data.type === "end_call") {
//                 console.log("CALL ENDED BY REMOTE");

//                 localStreamRef.current?.getTracks().forEach(t => t.stop());
//                 localStreamRef.current = null;

//                 if (remoteAudioRef.current) {
//                     remoteAudioRef.current.srcObject = null;
//                 }

//                 if (remoteVideoRef.current) {
//                     remoteVideoRef.current.srcObject = null;
//                 }

//                 pcRef.current?.close();
//                 pcRef.current = null;

//                 setIncomingCall(null);
//                 setInCall(false);
//             }



//         };
//     };

//     init();

//     return () => {
//         ws?.close();
//         wsCallRef.current = null;
        
//     };
// }, [userId]);



//     useEffect(() => {
//     if (remoteVideoRef.current && remoteStreamRef.current) {
//         remoteVideoRef.current.srcObject = remoteStreamRef.current;
//     }
// }, [inCall]);







// const createPC = (remoteUserId) => {
//     if (pcRef.current) return;

//     const pc = new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//     });

//     // pc.ontrack = (event) => {
//     //       const stream = event.streams[0];
//     //     remoteAudioRef.current.srcObject = stream;

//     //     // Принудительно сбросить mute и включить
//     //     remoteAudioRef.current.muted = false;
//     //     remoteAudioRef.current.volume = 1;

//     //     const playPromise = remoteAudioRef.current.play();
//     //     if (playPromise !== undefined) {
//     //         playPromise.catch(err => console.warn("Audio play blocked:", err));

//     //     }


        
//     //     // 🎥 VIDEO (только если видеозвонок)
//     //     if (callMode === "video" && remoteVideoRef.current) {
//     //         remoteVideoRef.current.srcObject = stream;
//     //     }

//     //     if (remoteAudioRef.current) {
//     //         console.log("AUDIO muted:", remoteAudioRef.current.muted);
//     //         console.log("AUDIO paused:", remoteAudioRef.current.paused);
//     //         console.log("AUDIO volume:", remoteAudioRef.current.volume);
//     //     }

//     // };

//   pc.ontrack = (event) => {
//     const stream = event.streams[0];
//     const audioTracks = stream.getAudioTracks();
//     const track = audioTracks[0];

//     console.log("🎤 REMOTE audio tracks count:", audioTracks.length);
//     console.log("🎤 REMOTE track enabled:", track?.enabled);
//     console.log("🎤 REMOTE track muted:", track?.muted);

//     if (!remoteAudioRef.current) return;

//     remoteAudioRef.current.srcObject = stream;
//     remoteAudioRef.current.muted = false;
//     remoteAudioRef.current.volume = 1;

//     //   ====== Audio level analyser =======
//     // const audioContext = new AudioContext();
//     // const source = audioContext.createMediaStreamSource(stream);
//     // const analyser = audioContext.createAnalyser();
//     // source.connect(analyser);
//     // const data = new Uint8Array(analyser.fftSize);
//     // setInterval(() => {
//     //     analyser.getByteTimeDomainData(data);
//     //     const max = Math.max(...data);
//     //     console.log("🔊 audio level:", max);
//     // }, 500);

//     // 🔑 Размьючиваем сам трек
//     track.enabled = true;

//     // ждем, когда трек начнет отдавать данные
//     track.onunmute = async () => {
//         console.log("🔓 Audio track unmuted");

//         try {
//         await remoteAudioRef.current.play();
//         console.log("paused:", remoteAudioRef.current.paused);
//         console.log("volume:", remoteAudioRef.current.volume);
//         console.log("readyState:", remoteAudioRef.current.readyState);
//         console.log("🔊 Audio started after track unmute");
//         console.log("🔊 remoteAudioRef.current.muted", remoteAudioRef.current.muted);
//         console.log("track.enabled:", track.enabled);
//         } catch (e) {
//         console.warn("play failed:", e);
//         }
//     };
// };


    

//     pc.onicecandidate = (event) => {
//         if (event.candidate) {
//             wsCallRef.current.send(JSON.stringify({
//                 type: "ice",
//                 target: remoteUserId,
//                 candidate: event.candidate
//             }));
//         }
//     };

//     pc.onsignalingstatechange = () => {
//         console.log("SIGNALING:", pc.signalingState);
//     };

//     pcRef.current = pc;
// };




//     const fetchTotalUnread = useProductFilter(s => s.fetchTotalUnread);




//     const handleScroll = () => {
//         if (chatRef.current.scrollTop === 0 && hasMore) {
//             loadMessages({
//                 targetId,
//                 LIMIT,
//                 reset: false,
//                 onAfterLoad: () => {
//                     setTimeout(() => {
//                         if (chatRef.current) chatRef.current.scrollTop = 10;
//                     }, 10);
//                 }
//             });
            
//         }
//     };






//     useEffect(() => {
//         if (!targetId) return;
//         //    if (!isInitialScroll.current) return; // 🔑
//            console.log('target useEffect')
//         console.log(
//         "CHAT OPEN SENT:",
//         "me =", userId,
//         "target =", targetId  );
//         loadMessages({
//             targetId,
//             LIMIT,
//             reset: true,
//             onAfterLoad: () => {
//                 scrollToBottom();
//                 isInitialScroll.current = false;
//             }
//         });
//     }, [targetId]);


//     useEffect(() => {
//         if (!targetId) return;

//         const ws = wsChatRef.current;
//         if (!ws || ws.readyState !== WebSocket.OPEN) return;

    
//         ws.send(JSON.stringify({
//             type: "chat_open",
//             target: targetId,
//         }));
//     }, [targetId]);


    

//     // useEffect(() => {
//     //     if (!targetId) return;

//     //     const ws = wsChatRef.current;
//     //     if (!ws) return;
//     //     if (ws.readyState !== WebSocket.OPEN) return;

//     //     ws.send(JSON.stringify({
//     //         type: "read",
//     //         target: targetId,
//     //     }));

//     // }, [targetId]);

//     const scrollToBottom = () => {
//         if (!chatRef.current) return;
//         chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
//     };









//     const sendMessage = async () => {
//         if (!text.trim() && files.length === 0) return;

      
//               // === если есть файлы — отправляем через API ===
//             if (files.length > 0) {

//                 try {
//                      const form = new FormData();
//                     form.append("target", targetId);
//                     if (text.trim()) form.append("text", text);
//                     for (let f of files) form.append("files", f);

//                     const res = await api.post("/private-chat/", form, {
//                         headers: { "Content-Type": "multipart/form-data" }
//                     });

                                
//                     const tempId = Date.now() + Math.random();

            
              

//                 // Сообщаем серверу, что сообщение создано
//                 wsChatRef.current.send(JSON.stringify({
//                     type: "message_created",
//                     message_id: res.data.id,
//                     temp_id: tempId,      // 🔑 Передаём temp_id
//                     target: targetId,
                 
                    
//                 }));


          


//                 clearText();
//                 setFiles([]);
//                 setPreviews([]);
//                 scrollToBottom();
            
      
    

//             // // отправляем собеседнику мгновенно
//             // wsChatRef.current.send(JSON.stringify({
//             //     type: "message",
//             //     target: targetId,
//             //     message: res.data,
//             // }));

//             // setMessages(prev => {
//             //     const exists = prev.some(m => m.id === data.message.id);
//             //     if (exists) return prev;
//             //     return [...prev, data.message];
//             // });

//             clearText();
//             setFiles([]);
//             setPreviews([]);
//             scrollToBottom();

//         }


//             catch(error) {
//                         console.error('Ошибка при отправке изображения или текста.', error)
//                     }
//                     return;
//         }
               
        
        

//        const tempId = Date.now() + Math.random(); // уникально
//     //    setMessages(prev => [
//     //     ...prev,
//     //     {
//     //         temp_id: tempId,
//     //         text: text.trim(),
//     //         is_own: true,
//     //         created_at: new Date().toISOString(),
//     //         // is_delivered: false,
//     //         // is_read: false,
//     //         pending: true
//     //     }
//     // ]);

//         wsChatRef.current.send(JSON.stringify({
//             type: "message",
//             target: targetId,
//             text: text.trim(),
//             temp_id: tempId
//         }));


       
       

        
                

//         // loadMessages({
//         //     targetId,
//         //     LIMIT,
//         //     reset: true,
//         //     onAfterLoad: () => {
//         //         scrollToBottom();
//         //         isInitialScroll.current = false;
//         //     }
//         // });

//         clearText();
//         scrollToBottom();
//     };







//     const applyPendingIce = async () => {
//     if (!pcRef.current?.remoteDescription) return;

//     for (const candidate of pendingIceRef.current) {
//         try {
//             await pcRef.current.addIceCandidate(candidate);
//         } catch (e) {
//             console.error("ICE apply error", e);
//         }
//     }

//     pendingIceRef.current = [];
// };




//   const startCall = async () => {
//         if (pcRef.current) return;

//         createPC(targetId);

//         localStreamRef.current = await navigator.mediaDevices.getUserMedia({
//             audio: true,
//             video: callMode === "video"
//         });
        

//         localStreamRef.current.getTracks().forEach(track =>
//             pcRef.current.addTrack(track, localStreamRef.current)
//         );

        


//         const offer = await pcRef.current.createOffer();
//         await pcRef.current.setLocalDescription(offer);

//         wsCallRef.current.send(JSON.stringify({
//             type: "offer",
//             target: targetId,
//             sdp: offer,
//             user_id: userId,
//             mode: callMode
//         }));

//         setInCall(true);
// };




// const acceptCall = async () => {
//       remoteAudioRef.current?.play().catch(() => {});
//     const offer = incomingOfferRef.current;
//     if (!offer) return;

//     createPC(offer.user_id);

//     localStreamRef.current = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: offer.mode === "video"
//     });


        
//     console.log(
//         "LOCAL audio tracks:",
//         localStreamRef.current.getAudioTracks()
//     );
//     localStreamRef.current.getTracks().forEach(track =>
//         pcRef.current.addTrack(track, localStreamRef.current)
//     );

//     await pcRef.current.setRemoteDescription(
//         new RTCSessionDescription(offer.sdp)
//     );

//     await applyPendingIce();

//     const answer = await pcRef.current.createAnswer();
//     await pcRef.current.setLocalDescription(answer);

//     wsCallRef.current.send(JSON.stringify({
//         type: "answer",
//         target: offer.user_id,
//         sdp: answer,
//         user_id: userId
//     }));

//     incomingOfferRef.current = null;
//     setIncomingCall(null);
//     setInCall(true);
// };









//     // const endCall = () => {
//     //     localStreamRef.current?.getTracks().forEach(t => t.stop());
//     //     pcRef.current?.close();
//     //     setInCall(false);
//     // };


// const endCall = () => {
//     console.log("END CALL");

//     // 1. Останавливаем локальные треки
//     localStreamRef.current?.getTracks().forEach(track => track.stop());
//     localStreamRef.current = null;

//     // 2. Очищаем remote media
//     if (remoteAudioRef.current) {
//         remoteAudioRef.current.srcObject = null;
//     }

//     if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = null;
//     }

//     // 3. Закрываем PeerConnection
//     if (pcRef.current) {
//         pcRef.current.ontrack = null;
//         pcRef.current.onicecandidate = null;
//         pcRef.current.close();
//         pcRef.current = null;
//     }

//     // 4. Уведомляем другого пользователя
//     if (wsCallRef.current?.readyState === WebSocket.OPEN) {
//         wsCallRef.current.send(JSON.stringify({
//             type: "end_call",
//             target: targetId,
//         }));
//     }

//     // 5. UI
//     setIncomingCall(null);
//     setInCall(false);
// };



//     const handleFileChange = (e) => {
//         const selectedFiles = Array.from(e.target.files);

//         setFiles(selectedFiles);

//         // создаём превью
//         const previewUrls = selectedFiles.map(file => ({
//             file,
//             url: URL.createObjectURL(file)
//         }));

//         setPreviews(previewUrls);
//     };


//     const removePreview = (index) => {
//         setPreviews(prev => {
//             URL.revokeObjectURL(prev[index].url);
//             return prev.filter((_, i) => i !== index);
//         });

//         setFiles(prev => prev.filter((_, i) => i !== index));
//     };

// const handleAcceptCall = async () => {
//     await acceptCall();

//     if (remoteAudioRef.current) {
//         remoteAudioRef.current.muted = false;
//         remoteAudioRef.current.volume = 1;

       
//     }
// };




// return (
//     <div className={styles.chat__wrapper}>
//         <div className={styles["chat__container"]} >
//         <ChatHeader
//             targetId={targetId}
//             userName={userName}
//             callMode={callMode}
//             setCallMode={setCallMode}
//             startCall={startCall}
//             acceptCall={acceptCall}
//             incomingCall={incomingCall}
//         />

            
//         <CallModal
//             incomingCall={incomingCall}
//             callMode={callMode}
//             inCall={inCall}
//             onAccept={handleAcceptCall}
//             onDecline={endCall}
//             onEnd={endCall}
//             // remoteAudioRef={remoteAudioRef}
//             // remoteVideoRef={remoteVideoRef}
//         />

//         <ChatMessages
//             messages={messages}
//             chatRef={chatRef}
//             onScroll={handleScroll}
//             styles={styles}
//             userId = {userId}
//         />

//         <div className={cn(styles.priview)}>
//             <ChatInput
//                     text={text}
//                     setText={setText}
//                     sendMessage={sendMessage}
//                     previews={previews}
//                     removePreview={removePreview}
//                     handleFileChange={handleFileChange}
//                     styles={styles}
//                 />
//         </div>
      
//        {/* 🔊 АУДИО ВСЕГДА В DOM */}
//             <audio
//                 ref={remoteAudioRef}
//                 autoPlay
//                 playsInline
//                 style={{ display: "block" }}
//             />

//     </div>

// </div>
           
//     );
// }

// export default PrivateChat;









// import { useEffect } from "react";
// import DoubleClickImage from "../../pages/Message/DoubleClickImage"
// import MessageStatus from "../../pages/Message/MessageStatus"
// import { formatDateLabel } from "../../utils/formatDateLabel";
// import AudioPlayer from '../UI/AudioPlayer'


// export default function ChatMessageItem({ index, msg, messages, styles, userId }) {
   

//       const isNewDay = (messages, index) => {
//             if (index === 0) return true;  
//             const prev = new Date(messages[index - 1].created_at).toDateString();
//             const current = new Date(messages[index].created_at).toDateString();
//             return prev !== current;
//         };

//     useEffect(() => {
//         // console.log('messages - ', msg)
//         // console.log('userId - ', userId)
//         // console.log('index - ', index)
       
//     }, [])


//     return (
//         <div>
//             {/* <div className={styles.chat__date}>
//                 <small>{new Date(msg.created_at).toLocaleDateString()}</small>
//             </div> */}

//             {
//                 isNewDay(messages, index) && (
//                     <small className={styles["chat__date"]}>
//                     {formatDateLabel(msg.created_at)}
//                 </small>
//                 )
//             }

//             <div
//                 className={`${styles.chat__message} ${
//                     msg.is_own ? styles.own : styles.other
//                 }`}
//             >
//                 <div
//                     className={`${styles.chat__text} ${
//                         msg.is_own ? styles["color-text"] : styles.sender
//                     }`}
//                 >
                   
//                     {msg.files?.map(file => {
//                         if (file.type === "image") {
//                             return <DoubleClickImage key={file.id} src={file.file} />;
//                         }

//                         if (file.type === "audio") {
//                             return <AudioPlayer key={file.id} file={file} />;
//                         }

//                         return null;
//                     })}


//                     {msg.text && <span>{msg.text}</span>}

//                     {/* ✅ статус ТОЛЬКО для моих сообщений */}
//                     {msg.is_own && (
//                        <MessageStatus
//                             isDelivered={msg.is_delivered}
//                             isRead={msg.is_read}
//                         />
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
