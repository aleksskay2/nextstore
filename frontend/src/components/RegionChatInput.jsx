import React from 'react'
import { useState, useRef, useEffect } from 'react';
import clip from "../assets/icons/clip.png";
import messageIcon from "../assets/icons/arrow_message.png";
import { cn } from "../utils/cn";
import styles from "./RegionChatInput.module.css";
import voiceMicrophone from "../assets/icons/voiceMicrophone.png";
import { useRegionChatStore } from './store/useRegionChatStore';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';





const RegionChatInput = ({
    replyMessage,
    setReplyMessage,
    
    isRecording,
}) => {
    const {
        text,
        region,
        setText,
        sendMessage,
        filePreviews,
        setFilesWithPreview,
        removePreview,
        setFiles,
    } = useRegionChatStore();

    // --- Логика таймера из GroupInput ---
    const [recordTime, setRecordTime] = useState(0);
    
    // const [files, setFiles] = useState([]);
    const recordInterval = useRef(null);
    const [previews, setPreviews] = useState([]);


    const { recording, startRecording, stopRecording } = useVoiceRecorder();


    useEffect(() => {
        if (isRecording) {
            recordInterval.current = setInterval(() => {
                setRecordTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(recordInterval.current);
            setRecordTime(0);
        }
        return () => clearInterval(recordInterval.current);
    }, [isRecording]);

    const formatTime = (sec = 0) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    };


    
  const toggleRecording = async () => {
  if (!recording) {
    startRecording();
  } else {
    const voiceFile = await stopRecording();

    setFiles(prev => [...prev, voiceFile]);
    setPreviews(prev => [
      ...prev,
      {
        file: voiceFile,
        url: URL.createObjectURL(voiceFile),
        type: "audio"
      }
    ]);
  }
};

    const Clear = () => {
        alert('dfg')
        setPreviews([])
    }
    

  useEffect(() => {
  if (recording) {
    recordInterval.current = setInterval(() => {
      setRecordTime(prev => prev + 1);
    }, 1000);
  } else {
    clearInterval(recordInterval.current);
    setRecordTime(0); // сброс после остановки
  }

  return () => clearInterval(recordInterval.current);
}, [recording]);


    // --- Обработка отправки ---
    const handleSendInternal = () => {
        // if (!text.trim() && filePreviews.length === 0) return;
        sendMessage(region, replyMessage?.id);
        setReplyMessage(null); // Очистка ответа после отправки
    };

    return (
        <div className={styles["content-send"]}>
            
            {/* 1. Блок ответа (Reply Preview) по аналогии с GroupInput */}
            {replyMessage && (
                <div className={styles.replyPreview}>
                    <div className={styles.replyLine} />
                    <div className={styles.replyContent}>
                        <div className={styles.replyAuthor}>
                            {replyMessage.username || replyMessage.sender_username}
                        </div>
                        {replyMessage.text && (
                            <div className={styles.replyText}>{replyMessage.text}</div>
                        )}
                        {!replyMessage.text && (replyMessage.images?.length > 0 || replyMessage.voice) && (
                            <div className={styles.replyFile}>
                                {replyMessage.voice ? "🎤 Голосовое сообщение" : "🖼 Фотография"}
                            </div>
                        )}
                    </div>
                    <button className={styles.replyClose} onClick={() => setReplyMessage(null)}>
                        ×
                    </button>
                </div>
            )}



               {/* 🖼 PREVIEW */}
                  {previews.length > 0 && (
                    <div >
                      {previews.map((p, i) => (
                        <div className={styles.preview}
                          key={i}
                          
                        >
                          {p.type === "image" && (
                            <img
                              src={p.url}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 8
                              }}
                            />
                          )}
            
                          {p.type === "video" && (
                            <video
                              src={p.url}
                              controls
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 8
                              }}
                            />
                          )}
            
                          {p.type === "audio" && (
                            <audio className={styles.previewAudio}    src={p.url} controls />
                          )}
            
                          <button 
                            onClick={() =>Clear()}
                            style={{
                              position: "absolute",
                              top: -6,
                              right: -6,
                              background: "black",
                              color: "white",
                              borderRadius: "50%",
                              width: 20,
                              height: 20,
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}



            {/* 2. Превью выбранных файлов */}
            {filePreviews.length > 0 && (
                <div className={styles.priview}>
                    {filePreviews.map((p, i) => (
                        <div key={p.url || i} className={styles.previewItem}>
                            <img
                                src={p.url}
                                alt=""
                                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                            />
                            <button
                                onClick={() => removePreview(p.url)}
                                className={styles.removeBtn}
                            > × </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={cn(styles.chat__send, styles.send)}>
                
                {/* 3. Микрофон + Таймер */}
                <div className={styles["microphone__content"]}>
                    <button
                        className={!recording ? styles["microphone__message"] : ""}
                        onClick={toggleRecording}
                    >
                        {recording ? (
                            <span  className={styles["microphone__line"]} >
                                ⏺ {formatTime(recordTime)}
                            </span>
                        ) : (
                            <img
                                src={voiceMicrophone}
                                alt="Voice"
                                className={styles.voiceIcon}
                            />
                        )}
                               </button>
                </div>

                {/* 4. Скрепка (Выбор файлов) */}
                <div className={styles["send__clip"]}>
                    <input
                        id="regionFile"
                        multiple
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => setFilesWithPreview(e.target.files)}
                    />
                    <label htmlFor="regionFile" style={{ cursor: "pointer" }}>
                        <img src={clip} alt="clip" />
                    </label>
                </div>

                {/* 5. Поле ввода текста */}
                <div className={styles["input__message"]}>
                    <input
                        type="text"
                        value={text}
                        placeholder={isRecording ? "Запись голоса..." : "Введите сообщение..."}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isRecording}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendInternal();
                        }}
                    />
                </div>

                {/* 6. Кнопка отправки */}
                <div className={styles["send__message"]}>
                    <button onClick={handleSendInternal} disabled={isRecording}>
                        <img src={messageIcon} alt="send" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegionChatInput;