export function AudioPlayer({ src }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        const duration = audioRef.current.duration;
        const currentTime = audioRef.current.currentTime;
        if (duration) {
            setProgress((currentTime / duration) * 100);
        }
    };

    return (
        <div style={{ width: "180px", marginTop: 8 }}>
            <audio ref={audioRef} controls preload="metadata">
                <source src={msg.voice} type="audio/webm" />
                Ваш браузер не поддерживает аудио
            </audio>

            <div
                style={{
                    width: "100%",
                    height: "4px",
                    background: "#ccc",
                    borderRadius: 4,
                    marginTop: 6,
                }}
            >
                <div
                    style={{
                        width: `${(audioProgress[msg.id] || 0) * 100}%`,
                        height: "100%",
                        background: "#4caf50",
                        borderRadius: 4,
                    }}
                />
            </div>
        </div>
    );
}

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import MessageStatus from "../pages/Message/MessageStatus";
import ImageGallery from "../pages/Message/ImageGallery";
import DoubleClickImage from "../pages/Message/DoubleClickImage";
import clip from "../assets/icons/clip.png";
import messageIcon from "../assets/icons/arrow_message.png";
import { cn } from "../utils/cn";
import styles from "./RegionChat.module.css";
import RegionSelect from "./UI/RegionSelect";
import { useProductFilter } from "./store/useProductFilter";
import { useRegionChatStore } from "./store/useRegionChatStore";
import { jwtDecode } from "jwt-decode";
import { formatDateLabel } from "../utils/formatDateLabel";
import SearchUser from "../pages/Message/SearchUser";
import useDictionary from "./store/useDictionary";
import RegionChatInput from "./RegionChatInput";
import { AudioPlayerRegion } from "./UI/AudioPlayerRegion";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";


function getCurrentUser() {
    const token = localStorage.getItem("access");
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch (e) {
        console.error("Ошибка при декодировании токена", e);
        return null;
    }
}

export default function RegionChat() {
    const { region, setRegion } = useProductFilter();
    const chatRef = useRef(null);
    const [replyMessage, setReplyMessage] = useState(null);
    const currentUser = getCurrentUser();

    const [galleryOpen, setGalleryOpen] = useState(false);

    const [galleryImages, setGalleryImages] = useState([]);

    const [startIndex, setStartIndex] = useState(0);

    const {
        messages,
        text,
        setText,
        connectSocket,
        disconnectSocket,
        sendMessage,
        loadMessages,
        loadNextPage,
        hasNext,
    } = useRegionChatStore();

    // Подключение к сокету и загрузка при смене региона
    useEffect(() => {
        loadMessages(region, 1);
        connectSocket(region);
        // return () => disconnectSocket();
    }, [region]);

    // Автоскролл при новых сообщениях
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        sendMessage(region, replyMessage?.id);
        setReplyMessage(null);
    };

    // 🔥 ПОДКЛЮЧАЕМ ХУК
    const { recording, startRecording, stopRecording } = useVoiceRecorder();


    // 🔥 ФУНКЦИЯ ЗАВЕРШЕНИЯ И ОТПРАВКИ ГОЛОСОВОГО
    const handleStopRecording = async () => {
        const voiceFile = await stopRecording(); // Получаем File из хука
        if (!voiceFile) return;

        const form = new FormData();
        form.append("region", region);
        form.append("voice", voiceFile); // Передаем готовый файл
        
        if (replyMessage) {
            form.append("reply_to", replyMessage.id);
        }

        try {
            await api.post("/region-chat/", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setReplyMessage(null);
            console.log("Голосовое успешно отправлено");
        } catch (err) {
            console.error("Ошибка отправки голосового", err);
        }
    };


    const sendVoice = async (blob) => {
        const form = new FormData();
        form.append("region", region);
        form.append("voice", blob, "voice.webm");

        try {
            await api.post("/region-chat/", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // loadMessages(region, 1); // обновить сразу
        } catch (err) {
            console.error("Ошибка отправки голосового", err);
        }
    };

    // const currentUser = getCurrentUser();

    // 1) Добавляем ref
    // const chatRef = useRef(null);

    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        if (!chatRef.current) return;
        if (!autoScroll) return;

        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const handleScroll = () => {
        const div = chatRef.current;
        if (!div) return;

        const isBottom =
            div.scrollHeight - div.scrollTop - div.clientHeight < 50;

        setAutoScroll(isBottom);

        // Если скролл вверх — грузим предыдущие сообщения
        if (div.scrollTop === 0 && hasNext) {
            loadPrevPage();
        }
    };

    const loadPrevPage = async () => {
        if (!hasNext) return;

        const div = chatRef.current;
        const oldHeight = div.scrollHeight;

        await loadNextPage(); // твоя функция из стора

        // ждём перерендера
        requestAnimationFrame(() => {
            const newHeight = div.scrollHeight;
            div.scrollTop = newHeight - oldHeight;
        });
    };

    const isNewDay = (messages, index) => {
        if (index === 0) return true;
        const prev = new Date(messages[index - 1]?.created_at).toDateString();
        const current = new Date(messages[index]?.created_at).toDateString();
        return prev !== current;
    };

    const handleShowSearch = (show) => {
        setShowSearch(show);
        alert("sdfasd");
    };

    useEffect(() => {
        console.log("messages", messages);
    }, []);

    return (
        <>
       <div className={styles.chatWrapper}>
                <div className={styles.chatContainer}>
                    <RegionSelect
                        region={region}
                        onChange={(r) => setRegion(r.value)}
                    />

                    <div
                        className={styles.chat}
                        ref={chatRef}
                        onScroll={(e) => {
                            if (e.target.scrollTop === 0 && hasNext) loadNextPage();
                        }}
                    >
                        {messages?.map((msg, index) => (
                            <div key={msg.id} className={styles.messageWrapper}>
                                {isNewDay(messages, index) && (
                                    <div className={styles.dateDivider}>
                                        {formatDateLabel(msg?.created_at)}
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        styles.message,
                                        msg?.user?.username === currentUser?.username
                                            ? styles.own
                                            : styles.other
                                    )}
                                    onDoubleClick={() => setReplyMessage(msg)}
                                >
                                    <div className={styles.author}>
                                        {msg.user?.avatar && (
                                            <img src={msg.user.avatar} className={styles.avatar} alt="avatar" />
                                        )}
                                        <span>{msg.user?.username}</span>
                                    </div>

                                    {msg.reply_to_details && (
                                        <div className={styles.replyInMessage}>
                                            <small>{msg.reply_to_details.username}</small>
                                            <p>{msg.reply_to_details.text}</p>
                                        </div>
                                    )}

                                    <div className={styles.textAndTime}>
                                        {msg.files.length > 0 && (
                                            <div className={styles.files}>
                                                {msg.files?.map((f) => (
                                                    <div key={f.id} className={styles.chatImg}>
                                                        {f.type === "image" && <img src={f.file} alt="" />}
                                                         {f.type === "audio" && <AudioPlayerRegion src={f.file}   />}  
                                                       
                                                        {/* {f.type === "audio" && 
                                                        <audio className={styles.previewAudio}    src={f.file} controls />}  */}
                                                       
                                                        {f.type === "video" && (
                                                            <video src={f.file} controls className={styles.chatVid} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className={styles.text}>{msg.text}</div>
                                        <small className={styles.time}>
                                            {new Date(msg.created_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Входные данные чата */}
                    <RegionChatInput
                        text={text}
                        setText={setText}
                        onSend={handleSend}
                        replyMessage={replyMessage}
                        setReplyMessage={setReplyMessage}
                        
                        // 🔥 Передаем новые пропсы записи
                        isRecording={recording} 
                        startRecording={startRecording}
                        stopRecording={handleStopRecording} 
                    />
                </div>
            </div>

               

            {galleryOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={() => setGalleryOpen(false)}
                >
                    <img
                        src={galleryImages[startIndex].image}
                        alt=""
                        style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                        }}
                    />
                </div>
            )}
            {/* <MessageStatus isRead={msg.is_read} /> */}
                
            

               
           
         

            

             
            
        </>
    );
}
