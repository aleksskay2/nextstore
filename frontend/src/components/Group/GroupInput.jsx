




import { useRef, useState, useEffect } from "react";
import api from "../../api/axios";
import styles from './GroupInput.module.css';
import clip from '../../assets/icons/clip.png'
import messageIcon from '../../assets/icons/arrow_message.png'

import videocamera from '../../assets/icons/videocamera.png'
import voiceMicrophone from "../../assets/icons/voiceMicrophone.png";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { useVideoRecorder } from "../../hooks/useVideoRecorder";
import { useVideoCompressor } from "../../hooks/useVideoCompressor";
import { useGroupsStore } from "../store/groups.store";
import { cn } from "../../utils/cn";





export default function GroupInput({ groupId }) {
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Store
  const replyMessage = useGroupsStore((s) => s.replyMessage);
  const clearReplyMessage = useGroupsStore((s) => s.clearReplyMessage);

  // Recorders
  const { recording, startRecording, stopRecording } = useVoiceRecorder();
  const {
    recording: videoRecording,
    startRecording: startVideo,
    stopRecording: stopVideo,
  } = useVideoRecorder();

  const [recordTime, setRecordTime] = useState(0);
  const recordInterval = useRef(null);

  /* 🛠 Общая функция отправки */
  const submitMessage = async (textValue, filesList) => {
    if (!textValue && filesList.length === 0) return;

    const formData = new FormData();
    formData.append("group", groupId);
    if (textValue) formData.append("text", textValue);

    if (replyMessage?.id) {
      formData.append("reply_to", replyMessage.id);
    }

    filesList.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await api.post("group-messages/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (filesList === files) {
          inputRef.current.value = "";
          setFiles([]);
          setPreviews([]);
      }
      clearReplyMessage();
    } catch (err) {
      console.error("Ошибка отправки:", err);
    }
  };

  /* 🎤 Логика микрофона */
  const toggleRecording = async () => {
    if (!recording) {
      startRecording();
    } else {
      const voiceFile = await stopRecording();
      // Отправляем сразу без превью
      await submitMessage("", [voiceFile]);
    }
  };

  const handleSend = () => {
    const text = inputRef.current.value.trim();
    submitMessage(text, files);
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const mapped = selected.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "audio",
    }));

    setFiles((prev) => [...prev, ...selected]);
    setPreviews((prev) => [...prev, ...mapped]);
  };

  const removePreview = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (recording) {
      recordInterval.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordInterval.current);
      setRecordTime(0);
    }
    return () => clearInterval(recordInterval.current);
  }, [recording]);

  const formatTime = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // 🔍 Хелпер для получения первого файла из replyMessage
  const replyFile = replyMessage?.files?.[0];

  return (
    <>
      {/* 1. Секция ответа (Reply Bar) */}
      {replyMessage && (
        <div className={styles.replyPreviewBar}>
          <div className={styles.replyVerticalLine} />
          
          <div className={styles.replyContent}>
            {/* Имя отправителя */}
            <small className={styles.replySender}>
              {replyMessage.sender_username || "Участник"}
            </small>

            {/* Контейнер для превью и текста */}
            <div className={styles.replyRow}>
              
              {/* 🖼 ПРЕВЬЮ КАРТИНКИ */}
              {replyFile?.type === "image" && (
                <img 
                  src={replyFile.file} 
                  alt="reply-preview" 
                  className={styles.replyThumb} 
                />
              )}

              {/* 📹 ПРЕВЬЮ ВИДЕО */}
              {replyFile?.type === "video" && (
                <video 
                  src={replyFile.file} 
                  className={styles.replyThumb} 
                  muted 
                  disablePictureInPicture
                />
              )}

              {/* 🎤 ИКОНКА АУДИО (если нет текста) */}
              {!replyMessage.text && replyFile?.type === "audio" && (
                 <span className={styles.replyAudioIcon}>🎤</span>

                 
              )}

              {/* ТЕКСТ СООБЩЕНИЯ ИЛИ ПОДПИСЬ ТИПА ФАЙЛА */}
             
             <p className={styles.replyText}>
                {replyMessage.text 
                  ? (replyMessage.text.length > 60 
                      ? replyMessage.text.substring(0, 60) + "..." 
                      : replyMessage.text)
                  : replyFile?.type === "audio"
                  ? "Голосовое сообщение"
                  : replyFile?.type === "video"
                  ? "Видео"
                  : replyFile?.type === "image"
                  ? "Фотография"
                  : "Вложение"}
              </p>
            </div>
          </div>

          <button className={styles.cancelReply} onClick={clearReplyMessage}>
            ×
          </button>
        </div>
      )}

      {/* Основной контейнер */}
      <div className={styles.mainContainer}>
        
        {/* 2. Секция превью загружаемых файлов */}
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
                <button
                  className={styles.removeBtn}
                  onClick={() => removePreview(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. Панель управления */}
        <div className={styles.inputWrapper}>
          <button
            className={cn(styles.actionBtn, videoRecording && styles.recordingPulse)}
            onClick={videoRecording ? stopVideo : startVideo}
          >
            {videoRecording ? "⏹" : <img src={videocamera} alt="Camera" />}
          </button>

          <div className={styles.fileUpload}>
            <input
              id="groupInputFile"
              multiple
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />
            <label htmlFor="groupInputFile" className={cn(styles.actionBtn, styles.clip)}>
              <img src={clip} alt="Attach" />
            </label>
          </div>

          <div className={styles.textContainer}>
            <input
              className={styles.textInput}
              ref={inputRef}
              placeholder="Введите сообщение..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </div>

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

          <button className={styles.sendBtn} onClick={handleSend}>
            <img src={messageIcon} alt="Send" />
          </button>
        </div>
      </div>
    </>
  );
}