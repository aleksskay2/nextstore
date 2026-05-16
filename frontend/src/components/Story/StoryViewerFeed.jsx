import { useStoryFeedStore } from "../store/useStoryFeedStore";
import { useState, useRef, useEffect } from "react";
import api from "../../api/axios";

import ChatInput from "../PrivateChat/ChatInput";
import { useChatStore } from "../store/useChatStore";

import styles from './StoryViewerFeed.module.css'
import stylesChatInput from './MessageStory.module.css'
import { useAppStore } from "../store/appStore";
import StoriesViewer from "./StoriesViewer";



import { IoClose } from "react-icons/io5"; // Иконка закрытия
import { usePrivateSocket } from "../../hooks/usePrivateChat";



export default function StoryViewerFeed() {

  const { stories, isViewerOpen, 
  startIndex, closeViewer,
  markStoryViewed 
 } = useStoryFeedStore();
 
  const user = useAppStore(s => s.user)
  const currentUserId = user?.id;

  const { text, setText, clearText, wsChatRef } = useChatStore();

  const [userIndex, setUserIndex] = useState(startIndex ?? 0);
  const [storyIndex, setStoryIndex] = useState(0);
  
  // Длительность по умолчанию (обновится, если видео)
  const [duration, setDuration] = useState(5000); 
  
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const group = stories[userIndex];
  const current = group?.stories?.[storyIndex];
  const targetId = group?.user?.id;

  // const wsChatRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);


  // Получаем текущего юзера (нужно для инициализации сокета, если он еще не открыт)
  // const [currentUserId, setCurrentUserId] = useState(null);
  // useEffect(() => {
  //     api.get("user/").then(res => setCurrentUserId(res.data.id));
  // }, []);

  // usePrivateSocket(currentUserId, targetId)

  // 1. Инициализация при открытии
  useEffect(() => {
    if (isViewerOpen) {
      setUserIndex(startIndex ?? 0);
      setStoryIndex(0);
      setIsPaused(false);
      clearText();
    }
  }, [isViewerOpen, startIndex]);

  // 2. Сброс при смене слайда
  useEffect(() => {
    setIsPaused(false);
    clearText();
    setFiles([]);
    setPreviews([]);
    // Не сбрасываем duration здесь жестко, оно установится в теге video/img
  }, [userIndex, storyIndex]);

  // 3. Таймер переключения (только для картинок)
  useEffect(() => {
    if (!isViewerOpen || !current || isPaused) return;
    
    // Если видео — таймером управляет onEnded видео
    if (current.media.endsWith(".mp4")) return;

    const t = setTimeout(next, duration);
    return () => clearTimeout(t);
  }, [storyIndex, userIndex, isViewerOpen, duration, isPaused]);

  // Логика переключения
  const next = () => {
  
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else if (userIndex < stories.length - 1) {
      setUserIndex(prev => prev + 1);
      setStoryIndex(0);
    } else {
      handleClose();
    }
  };

  const prev = () => {
   
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else if (userIndex > 0) {
      setUserIndex(prev => prev - 1);
      setStoryIndex(stories[userIndex - 1].stories.length - 1);
    }
  };

  const handleClose = () => {
    setIsPaused(false);
    clearText();
    closeViewer();
  };


  
   

  // --- Чат и отправка ---
  const sendMessage = async () => {
    if (!text.trim() && files.length === 0) return;
    const currentTargetId = stories[userIndex]?.user?.id;

    try {
      const form = new FormData();
      form.append("target", currentTargetId);
      if (text.trim()) form.append("text", text);
      for (let f of files) form.append("files", f);

      const res = await api.post("/private-chat/", form);
      
      // 🔥 ИСПОЛЬЗУЕМ СОКЕТ ИЗ СТОРА
      const socketPayload = JSON.stringify({
        type: "message_created",
        message_id: res.data.id,
        target: currentTargetId,
      });

      wsChatRef?.send(socketPayload); // Локальный сокет чата
      // globalWsRef?.current?.send(socketPayload); // Глобальный сокет
      

      clearText();
      setFiles([]);
      setPreviews([]);
      setIsPaused(false);
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleInputFocus = (e) => {
    e.stopPropagation();
    setIsPaused(true); // СТАВИМ ПАУЗУ
  };

  const handleInputBlur = () => {
    // Снимаем паузу только если пусто
    if (text.length === 0 && files.length === 0) {
      setIsPaused(false);
    }
  };


  // mark viewed (чужие сторис)

  useEffect(() => {

    if (!isViewerOpen || !current) return;

    api.post(`stories/${current.id}/view/`).catch(() => {});
    markStoryViewed(current.id)

  }, [current?.id, isViewerOpen]);

  // --- Файлы и запись (сокращено для краткости, вставь свои функции) ---
  const handleFileChange = (e) => { /* твой код */ };
  const removePreview = (i) => { /* твой код */ };
  const startRecording = () => { setIsPaused(true); /* твой код */ };
  const stopRecording = () => { setIsPaused(false); /* твой код */ };

  if (!isViewerOpen || !group || !current) return null;

  return (
    <div className={styles.storiesViewer}>
       {/* === ЗОНЫ КЛИКА === */}
        <div className={styles.leftZone} onClick={prev} />
        <div className={styles.rightZone} onClick={next} />
      <div className={styles.storyWindow}>
        
       {/* === ПРОГРЕСС БАР (Новая логика) === */}
        <div className={styles["story-progress"]}>
          {group.stories.map((_, i) => {
            const isFinished = i < storyIndex;
            const isActive = i === storyIndex;
            
            return (
              <div key={i} className={styles.bar}>
                <div 
                  className={`
                    ${styles.fill} 
                    ${isActive ? styles.fillActive : ""} 
                    ${isFinished ? styles.fillFinished : ""}
                  `}
                  style={isActive ? {
                    animationDuration: `${duration}ms`,
                    animationPlayState: isPaused ? "paused" : "running"
                  } : {}}
                />
              </div>
            );
          })}
        </div>

        {/* === ШАПКА === */}
        <div className={styles.storyHeader}>
           <div className={styles.avatarWrapper}>
             <img src={group.user?.avatar || "/default-avatar.png"} alt="avatar" />
           </div>
           <span className={styles.username}>{group.user?.username}</span>
           <button className={styles.closeButton} onClick={closeViewer}>
             <IoClose />
           </button>
        </div>

        {/* === КОНТЕНТ === */}
        <div className={styles.storyContent}>
          {current.media.endsWith(".mp4") ? (
            <video
              key={current.media}
              src={current.media}
              autoPlay
              // Важно: видео должно останавливаться при паузе
              ref={(ref) => {
                if (ref && isPaused && !ref.paused) ref.pause();
                if (ref && !isPaused && ref.paused) ref.play();
              }}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration * 1000)}
              onEnded={next}
            />
          ) : (
            <img src={current.media} alt="story" />
          )}
        </div>

      <StoriesViewer/>

        {/* === ФУТЕР (ИНПУТ) === */}
        <div
          className={styles.storyChatFooter}
          onClick={(e) => e.stopPropagation()} // Блокируем клик по фону футера
          onFocus={handleInputFocus}          // Ловим фокус (bubble up от input)
          onBlur={handleInputBlur}            // Ловим потерю фокуса
        >


          

          {/* <ChatInput
            text={text}
            // Здесь просто обновляем текст, не меняя isPaused
            setText={setText} 
            onFocus={handleInputFocus} // На всякий случай прокидываем и внутрь
            onBlur={handleInputBlur}
            sendMessage={sendMessage}
            previews={previews}
            removePreview={removePreview}
            handleFileChange={handleFileChange}
            recording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            styles={stylesChatInput}
          /> */}
        </div>
         
      </div>

      
    </div>
  );
}







