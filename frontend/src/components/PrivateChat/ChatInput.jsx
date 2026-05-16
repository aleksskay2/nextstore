







import { useState, useRef } from "react";
import {cn} from  "../../utils/cn";

import clip from "../../assets/icons/clip.png"
import messageIcon from "../../assets/icons/arrow_message.png"
// import styles from './ChatInput.module.css'
import { useChatStore } from "../store/useChatStore";
import voiceMicrophone from "../../assets/icons/voiceMicrophone.png";
import { useVideoRecorder } from "../../hooks/useVideoRecorder";
import videocamera from '../../assets/icons/videocamera.png'







export default function ChatInput({
    sendMessage,
 

    previews,        // Приходит из PrivateChat
    setPreviews,     // Добавьте, если нужно обновлять внутри
    setFiles,        // Добавьте, если нужно обновлять внутри
    removePreview,
    handleFileChange,
    startRecording,
    stopRecording,
    recording,

    // Новые пропсы
    videoRecording,
    startVideo,
    stopVideo,
    styles
   
}) {
    const text = useChatStore(state => state.text);
    const setText = useChatStore(state => state.setText);
    const clearText = useChatStore(state => state.clearText);

    const [recordTime, setRecordTime] = useState(0);

    // 🔥 Достаем данные для ответа из стора
    const replyMessage = useChatStore(state => state.replyMessage);
    const clearReplyMessage = useChatStore(state => state.clearReplyMessage);
    

    // console.log('ChatInput')

    const recordInterval = useRef(null);

    const toggleRecording = async () => {
        if (!recording) {
            // старт записи
            setRecordTime(0);
            startRecording();

            recordInterval.current = setInterval(() => {
                setRecordTime(prev => prev + 1);
            }, 1000);
        } else {
            // стоп записи
            stopRecording();
            clearInterval(recordInterval.current);
            setRecordTime(0);
        }
    };

    const formatTime = (sec = 0) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    return (
        <>


        {/* 1. Секция ответа (Reply Bar) — Появляется, когда выбрали "Ответить" */}
            {replyMessage && (
                <div className={styles.replyPreviewBar}>
                    <div className={styles.replyVerticalLine}></div>
                    <div className={styles.replyContent}>
                        <small className={styles.replySender}>
                            {replyMessage.is_own ? "Вы" : "Собеседник"}
                        </small>
                        <p className={styles.replyText}>
                            {replyMessage.text || (replyMessage.files?.length > 0 ? "📎 Файл" : "Сообщение")}
                        </p>
                    </div>
                    <button className={styles.cancelReply} onClick={clearReplyMessage}>
                        ×
                    </button>
                </div>
            )}

    
        <div className={styles.mainContainer}>
    {/* Секция превью (над инпутом) */}
    {previews.length > 0 && (
        <div className={styles.previewBar}>
            {previews.map((p, i) => (
                <div key={i} className={styles.previewItem}>
                    {p.type === "video" ? (
                        <video src={p.url} className={styles.previewMedia} />
                    ) : p.type === "audio" ? (
                        <div className={styles.audioPlaceholder}>🎵</div>
                    ) : (
                        <img src={p.url} className={styles.previewMedia} alt="" />
                    )}
                    <button className={styles.removeBtn} onClick={() => removePreview(i)}>×</button>
                </div>
            ))}
        </div>
    )}

    {/* Основная панель управления */}
    <div className={styles.inputWrapper}>
        {/* 1. Камера */}
        <button 
            className={cn(styles.actionBtn, videoRecording && styles.recordingPulse)} 
            onClick={videoRecording ? stopVideo : startVideo}
        >
            {videoRecording ? "⏹" : <img src={videocamera} alt="Camera" />}
        </button>

        {/* 2. Скрепка (Файлы) */}
        <div className={styles.fileUpload}>
            <input
                id="inputFile"
                multiple
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileChange}
                className={styles.hiddenInput}
            />
            <label htmlFor="inputFile" className={cn(styles.actionBtn, styles.clip)}>
                <img src={clip} alt="Attach" />
            </label>
        </div>

        {/* 3. Поле ввода */}
        <div className={styles.textContainer}>
            <input
                className={styles.textInput}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введите сообщение..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
        </div>

        {/* 4. Микрофон */}
        <button 
            className={cn(styles.actionBtn, styles.voiceAudio, recording && styles.recordingPulse)} 
            onClick={toggleRecording}
        >
            {recording ? (
                <span className={styles.timer}>{formatTime(recordTime)}</span>
            ) : (
                <img src={voiceMicrophone} alt="Voice" />
            )}
        </button>

        {/* 5. Кнопка отправить */}
        <button className={styles.sendBtn} onClick={sendMessage}  >
            <img src={messageIcon} alt="Send" />
        </button>
    </div>
</div>



            
        </>
    );
}




