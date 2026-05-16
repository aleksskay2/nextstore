

import { useParams, Link, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";


import styles from "./PrivateChat.module.css";
import { cn } from "../../utils/cn";
import api from "../../api/axios";

import useStore from "../store/store";
import { useProductFilter } from "../store/UseProductFilter";
import { useChatStore } from "../store/useChatStore";
import { useAppStore } from "../store/appStore";
import stylesChatInput from './ChatInput.module.css';
import { usePrivateSocket } from "../../hooks/usePrivateChat";
import { useVideoRecorder } from "../../hooks/useVideoRecorder";
import { compressImageWeb } from "../../utils/compressImageWeb"; // Импортируй созданную функцию

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";



const PrivateChat = () => {
    const { targetId } = useParams();
    const location = useLocation();
    const avatar = location.state
    // const [messages, setMessages] = useState([]);
    // const [text, setText] = useState("");

    const text = useChatStore((state) => state.text);
    const setText = useChatStore((state) => state.setText);
    const clearText = useChatStore((state) => state.clearText);

    const [files, setFiles] = useState([]);
    // const [hasMore, setHasMore] = useState(true);
    const [userName, setUserName] = useState("");
    const [userId, setUserId] = useState("");
    const chatRef = useRef(null);
    const isInitialScroll = useRef(true);
    // const user = useStore((s) => s.user);
    const LIMIT = 15;

    // WebRTC
    // const wsChatRef = useRef(null);

    const [previews, setPreviews] = useState([]);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [isRecording, setIsRecording] = useState(false);

    const { messages, loadMessages, hasMore, setMessages , setWsChatRef} = useChatStore();

    // Добавляем хук видео
    const {
        recording: videoRecording,
        startRecording: startVideo,
        stopRecording: stopVideo
    } = useVideoRecorder();


    

    // ===== LOAD USER =====
    const fetchUser = async () => {
        try {
            const res = await api.get(`/users/${targetId}/`);
            console.log("target - ", targetId);
            setUserName(res.data.username);
        } catch (err) {
            console.error("Ошибка загрузки профиля", err);
        }
    };

   
   

    const wsRef = useAppStore((s) => s.wsRef);

    // Загрузка ID пользователя
    useEffect(() => {
        api.get("user/").then(res => setUserId(Number(res.data.id)));
    }, []);

    // Используем наш новый хук
    const wsChatRef = usePrivateSocket(userId, targetId);


    const callWsInitialized = useRef(false);

    const startRecording = async () => {
        if (isRecording) return;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });

        const recorder = new MediaRecorder(stream, {
            mimeType: "audio/webm",
        });

        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            recorder.stream.getTracks().forEach((t) => t.stop());

            if (!audioChunksRef.current.length) return;

            const blob = new Blob(audioChunksRef.current, {
                type: "audio/webm",
            });
            const file = new File([blob], `voice_${Date.now()}.webm`, {
                type: "audio/webm",
            });

            await sendVoiceMessage(file);
        };

        recorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
    };

    const sendVoiceMessage = async (audioFile) => {
        try {
            const form = new FormData();
            form.append("target", targetId);
            form.append("files", audioFile);
            form.append("type", "audio"); // если нужно на бэке

            const res = await api.post("/private-chat/", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            wsChatRef.current.send(
                JSON.stringify({
                    type: "message_created",
                    message_id: res.data.id,
                    target: targetId,
                })
            );

            // уведомляем глобальный WS (все сессии / другие вкладки)
            wsRef?.current?.send(
                JSON.stringify({
                    type: "message_created",
                    message_id: res.data.id,
                    target: targetId,
                })
            );

            scrollToBottom();
        } catch (err) {
            console.error("Voice send error", err);
        }
    };

    // Добавьте этот ref в начало компонента PrivateChat
const isFetching = useRef(false);

    const handleScroll = async () => {
        const container = chatRef.current;
        if (!container || isFetching.current || !hasMore) return;

        // Если мы почти у самого верха (порог 50px)
        if (container.scrollTop < 50) {
            isFetching.current = true;

            // 1. Запоминаем текущую высоту и позицию
            const scrollHeightBefore = container.scrollHeight;
            const currentScrollTop = container.scrollTop;

            await loadMessages({
                targetId,
                LIMIT,
                reset: false,
                onAfterLoad: () => {
                    // 2. Используем requestAnimationFrame для коррекции скролла
                    requestAnimationFrame(() => {
                        if (chatRef.current) {
                            const scrollHeightAfter = chatRef.current.scrollHeight;
                            const heightDifference = scrollHeightAfter - scrollHeightBefore;
                            
                            // 3. Сдвигаем скролл на разницу высот, чтобы визуально остаться на месте
                            chatRef.current.scrollTop = currentScrollTop + heightDifference;
                        }
                        isFetching.current = false;
                    });
                },
            });
        }
    };

 

    const [isReady, setIsReady] = useState(false); // Новое состояние

    useEffect(() => {
        if (!targetId) return;
     
        wsChatRef.current?.send(JSON.stringify({ type: "chat_open", target: targetId }));
            
        
        setIsReady(false); // Скрываем чат при смене собеседника
        isInitialScroll.current = true; 
        
        fetchUser();
        
        loadMessages({
            targetId,
            LIMIT,
            reset: true,
            onAfterLoad: () => {
                // 1. Сначала прыгаем вниз мгновенно
                scrollToBottom(true);
                
                // Ждем чуть-чуть, пока всё отрендерится и показываем чат
                setTimeout(() => {
                    scrollToBottom(true);
                    setIsReady(true);
                }, 50);

                // 2. Даем браузеру отрисовать позицию и показываем чат
                requestAnimationFrame(() => {
                    scrollToBottom(true); // Повторный вызов для надежности
                    setIsReady(true);
                    isInitialScroll.current = false;
                });
            },
        });
    }, [targetId]);

    
    // Улучшенная функция прокрутки вниз
    const scrollToBottom = (isInstant = false) => {
        if (!chatRef.current) return;
        
        // Используем setTimeout 0, чтобы дать браузеру один цикл на расчет высоты элементов
        setTimeout(() => {
            const container = chatRef.current;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: isInstant ? "auto" : "smooth",
            });
        }, 0);
    };


    const detectFileType = (file) => {
        if (file.type.startsWith("image/")) return "image";
        if (file.type.startsWith("video/")) return "video";
        if (file.type.startsWith("audio/")) return "audio";
        return "file";
    };

  

    const sendMessage = async () => {
        if (!text.trim() && files.length === 0) return;

        const replyMessage = useChatStore.getState().replyMessage;
        const clearReplyMessage = useChatStore.getState().clearReplyMessage;

        try {
            const form = new FormData();
            form.append("target", targetId);
            
            if (text.trim()) form.append("text", text);
            if (replyMessage) form.append("reply_to", replyMessage.id);

            // 🔥 ВАЖНО: Используем цикл for...of для поддержки await
            for (let f of files) {
                if (f.type.startsWith("image/")) {
                    console.log(`⏳ Сжимаю ${f.name}...`);
                    const compressedFile = await compressImageWeb(f, { 
                        maxWidth: 1200, 
                        quality: 0.7 
                    });
                    form.append("files", compressedFile);
                    console.log(`✅ Сжато: ${(f.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`);
                } else {
                    // Видео, аудио и документы отправляем как есть
                    form.append("files", f);
                }
            }

            const res = await api.post("/private-chat/", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Сообщаем серверу через WebSocket
            const socketPayload = JSON.stringify({
                type: "message_created",
                message_id: res.data.id,
                target: targetId,
            });

            wsChatRef.current.send(socketPayload);
            wsRef?.current?.send(socketPayload);

            // Очищаем всё после успешной отправки
            clearText();
            setFiles([]);
            setPreviews([]);
            clearReplyMessage(); 
            scrollToBottom(false);

        } catch (error) {
            console.error("Ошибка при отправке:", error);
            alert("Не удалось отправить сообщение");
        }
    };



    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        setFiles(selectedFiles);

        const previewUrls = selectedFiles.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            type: detectFileType(file), // 👈 ВАЖНО
        }));

        setPreviews(previewUrls);
    };

    const removePreview = (index) => {
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });

        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Функция для обработки остановки записи видео
    const handleStopVideo = async () => {
        const videoFile = await stopVideo();
        setFiles(prev => [...prev, videoFile]);
        setPreviews(prev => [
            ...prev,
            {
                file: videoFile,
                url: URL.createObjectURL(videoFile),
                type: "video"
            }
        ]);
    };


    return (
        <div className={styles.chat__wrapper}>
            <div className={styles["chat__container"]}>
                <ChatHeader targetId={targetId} userName={userName} avatar={avatar} />

                <ChatMessages
                    messages={messages}
                    chatRef={chatRef}
                    onScroll={handleScroll}
                    className={isReady ? styles.chatVisible : styles.chatHidden}
                    styles={styles}
                    userId={userId}
                />

                <div className={cn(styles.priview)}>
                    <ChatInput
                        text={text}
                        setText={setText}
                        sendMessage={sendMessage}
                        previews={previews}
                        setPreviews={setPreviews} // передаем сеттер
                        setFiles={setFiles}       // передаем сеттер
                        removePreview={removePreview}
                        handleFileChange={handleFileChange}
                        isRecording={isRecording}
                        startRecording={startRecording}
                        stopRecording={stopRecording}
                        recording={isRecording}

                        // Видео (новые пропсы)
                        videoRecording={videoRecording}
                        startVideo={startVideo}
                        stopVideo={handleStopVideo}

                        styles={stylesChatInput}
                    />
                </div>
            </div>
        </div>
    );
};

export default PrivateChat;
