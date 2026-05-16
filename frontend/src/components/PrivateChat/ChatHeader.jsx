



import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import api from "../../api/axios";
import videocamera from '../../assets/icons/videocamera.png'
import { useOnlineStore } from "../store/useOnlineStore";
import styles from './ChatHeader.module.css';
import { IoVideocam, IoCall, IoCloseCircle } from "react-icons/io5"; // Рекомендую react-icons

export default function ChatHeader({
    targetId,
    userName,
    avatar
    // endCall,
    // startCall,
    // callActive,
    // incomingCall,
    // acceptCall
}) {


  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const pendingCandidates = useRef([]);
  const localStreamRef = useRef(null);
  const answerAppliedRef = useRef(false);

  // online
  // const onlineUsers = useOnlineStore((s) => s.onlineUsers);
  // const isOnline = onlineUsers.has(Number(targetId));

//   const isOnline = useOnlineStore((s) => s.onlineUsers.has(targetId));
// const lastSeen = useOnlineStore((s) => s.lastSeen[targetId]);


  const onlineUsers = useOnlineStore((s) => s.onlineUsers);
  const lastSeen = useOnlineStore((s) => s.lastSeen);

  const isOnline = onlineUsers.has(Number(targetId));
  const lastSeenTs = lastSeen[targetId];


const userIdRef = useRef(null); // Это будет наш стабильный ID
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [userId, setUserId] = useState(null);

  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  /* ================= INIT ================= */






  useEffect(() => {
        const init = async () => {
          const response = await api.get("user/");
          // setUserId(response.data.id);
          const userId = response.data.id;
          setUserId(response.data.id)
          userIdRef.current = userId; // ДЛЯ WEBRTC (всегда актуально)
          // if (!userId) return
          wsRef.current = new WebSocket(
            `ws://192.168.42.2:8000/ws/call/${userId}/`
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
  }, [targetId]
  );



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

    if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

  

    pc.ontrack = (event) => {
    console.log("🎬 Трек получен. Тип:", event.track.kind);
    const remoteVideo = remoteVideoRef.current;
    
    if (!remoteVideo) return;

    // Если в теге уже есть поток, просто добавляем в него прилетевший трек
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.addTrack(event.track);
        console.log("➕ Трек добавлен в существующий поток");
    } else {
        // Если потока еще нет, создаем новый
        remoteVideo.srcObject = event.streams[0] || new MediaStream([event.track]);
        console.log("✅ Создан новый поток и привязан к видео-тегу");
    }
    
    // Принудительно запускаем видео, если браузер заблокировал автоплей
    remoteVideo.play().catch(e => console.warn("▶️ Автоплей заблокирован:", e));
};

    pc.onicecandidate = (event) => {
        console.log("📤 Отправляю кандидата. From:", userIdRef.current);
        if (event.candidate) {
            wsRef?.current?.send(JSON.stringify({
                type: "ice-candidate",
                target: targetId,
                candidate: event.candidate,
                from: userIdRef.current // Убедись, что userId берется из стейта
            }));
        }
    };


    pc.oniceconnectionstatechange = () => {
        console.log("🌐 Состояние сети (ICE):", pc.iceConnectionState);
    };

    return pc;
};


  /* ================= CALL FLOW ================= */

  // В startCall тоже добавь sdpType
const startCall = async (type) => {

    setCallActive(true);
    const stream = await getLocalStream(type);
    pcRef.current = createPeerConnection(stream);

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    wsRef?.current?.send(JSON.stringify({
        type: "offer",
        target: targetId,
        sdp: offer.sdp,
        sdpType: offer.type, // Добавляем
        from: userId
    }));

   
};
 


  const acceptCall = async (type) => {
    const stream = await getLocalStream(type);
    pcRef.current = createPeerConnection(stream);

    // Используем конструктор для SDP
    await pcRef.current.setRemoteDescription(new RTCSessionDescription({
        type: incomingCall.sdpType || "offer",
        sdp: incomingCall.sdp,
    }));

    // Добавляем накопившиеся кандидаты
    for (const c of pendingCandidates.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
    }
    pendingCandidates.current = [];

    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);

    wsRef.current.send(JSON.stringify({
        type: "answer",
        target: incomingCall.from,
        sdp: answer.sdp,
        sdpType: answer.type, // Добавляем для мобилки
        from: userId
    }));

    setIncomingCall(null);
    setCallActive(true);
};

  

 
const handleAnswer = async (data) => {
    const pc = pcRef.current;
    if (!pc) return;

    // 1. ПРОВЕРКА: Если мы уже в stable, значит ответ уже применен. Игнорируем дубликат.
    if (pc.signalingState === "stable") {
        console.log("♻️ Answer уже применен, игнорируем дубликат");
        return;
    }

    // 2. ПРОВЕРКА: Answer можно применять только если мы отправили Offer (have-local-offer)
    if (pc.signalingState !== "have-local-offer") {
        console.warn("⚠️ Попытка применить Answer в неподходящем состоянии:", pc.signalingState);
        return;
    }

    try {
        await pc.setRemoteDescription(new RTCSessionDescription({
            type: data.sdpType || "answer",
            sdp: data.sdp,
        }));
        console.log("✅ Remote Description (Answer) установлен успешно");

        // Проталкиваем кандидатов, если они накопились
        if (pendingCandidates.current.length > 0) {
            console.log(`⏳ Проталкиваем ${pendingCandidates.current.length} ICE-кандидатов`);
            for (const c of pendingCandidates.current) {
                await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidates.current = [];
        }
    } catch (e) {
        console.error("❌ Ошибка в setRemoteDescription (Web):", e);
    }
};


 
  const handleNewICECandidate = async (data) => {
      try {
          const pc = pcRef.current;
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
              console.log("⏳ Кандидат в очереди (ждем SDP)");
              pendingCandidates.current.push(data.candidate);
          }
      } catch (e) {
          console.error("❌ Ошибка добавления ICE:", e);
      }
  };

  const endCall = (sendSignal = true) => {
    answerAppliedRef.current = false; // 🔥 ОБЯЗАТЕЛЬНО СБРАСЫВАЕМ
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

  useEffect(() => {
    console.log('online', isOnline)
    console.log('targetId', targetId)
  },[])

  useEffect(() => {
  console.log("ONLINE USERS:", [...onlineUsers]);
}, [onlineUsers]);






    return (
        <header className={styles.header}>
            {/* --- ЛЕВАЯ ЧАСТЬ: ИНФО О ЮЗЕРЕ --- */}
            <div className={styles.userInfo}>
                <div className={styles.avatar}>
                    {/* {userName?.charAt(0).toUpperCase()} */}
                    <img src={avatar} alt="" />
                    {isOnline && <div className={styles.onlineBadge} />}
                </div>
                <div className={styles.textDetails}>
                    <Link to={`/user/${targetId}`} className={styles.userName}>
                        {userName}
                    </Link>
                    {/* <span className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}>
                        {isOnline ? "в сети" : "был недавно"}
                    </span>  */}


                    <span
                      className={`${styles.status} ${
                        isOnline ? styles.online : styles.offline
                      }`}
                    >
                      {isOnline
                        ? "в сети"
                        : lastSeenTs
                        ? formatLastSeen(lastSeenTs)
                        : "недавно был"}
                    </span>


                   
                </div>
            </div>

            {/* --- ПРАВАЯ ЧАСТЬ: УПРАВЛЕНИЕ ЗВОНКАМИ --- */}
            <div className={styles.controls}>
                {!callActive && !incomingCall && (
                    <div className={styles.callGroup}>
                        <button className={styles.iconBtn} onClick={() => startCall("video")} title="Видеозвонок">
                            <IoVideocam />
                        </button>
                        <button className={styles.iconBtn} onClick={() => startCall("audio")} title="Аудиозвонок">
                            <IoCall />
                        </button>
                    </div>
                )}

                {!callActive && incomingCall && (
                    <div className={styles.incomingGroup}>
                        <button className={`${styles.btn} ${styles.accept}`} onClick={() => acceptCall("video")}>Принять</button>
                        <button className={`${styles.btn} ${styles.decline}`} onClick={endCall}>Отклонить</button>
                    </div>
                )}

                {callActive && (
                    <button className={`${styles.iconBtn} ${styles.endCall}`} onClick={endCall}>
                        <IoCloseCircle />
                    </button>
                )}
            </div>

            {/* Скрытые видео-элементы для WebRTC */}

           {
            (callActive && (
                <div className={styles.hiddenVideos}>
                  {/* Локальное: всегда muted, чтобы не слышать эхо от самого себя */}
                  <video ref={localVideoRef} autoPlay muted playsInline className={styles.MYvideoElement} />
                  
                  {/* Удаленное: НЕ muted, чтобы слышать собеседника */}
                  <video ref={remoteVideoRef} autoPlay playsInline className={styles.friendVideoElement} />
              </div>
            ))
           } 
           
        </header>
    );
};





