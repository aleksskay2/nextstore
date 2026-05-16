import { useState, useEffect , useRef} from "react";
import { useProductStore } from "../../components/store/useProductStore";
import { useProductChatSocket } from "../../hooks/useProductChatSocket";
import { cn } from "../../utils/cn";
import clip from "../../assets/icons/clip.png";
import messageIcon from "../../assets/icons/arrow_message.png";
import api from "../../api/axios";
import { useAppStore } from "../../components/store/appStore";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import voiceMicrophone from "../../assets/icons/voiceMicrophone.png";
import styles from './ChatProductInput.module.css'


export default function ChatInput({productId, companionId, userId }) {
   const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  const [recordTime, setRecordTime] = useState(0);
  const recordInterval = useRef(null);

  const wsRef = useAppStore(s => s.wsRef)

  const addMessage = useProductStore((s) => s.addMessage);


  const { recording, startRecording, stopRecording } = useVoiceRecorder();

  // Форматирование времени 0:00
    const formatTime = (sec = 0) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    // Управление таймером при изменении статуса записи
    useEffect(() => {
        if (recording) {
            setRecordTime(0);
            recordInterval.current = setInterval(() => {
                setRecordTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(recordInterval.current);
            setRecordTime(0);
        }
        return () => clearInterval(recordInterval.current);
    }, [recording]);

    const toggleRecording = async () => {
        if (!recording) {
            await startRecording();
        } else {
            const audioFile = await stopRecording();
            if (audioFile) {
                await sendMessage(audioFile);
            }
        }
    };


 
    const sendMessage = async (audioFile = null) => {
    if (!text.trim() && files.length === 0 && !audioFile) return;

    try {
        const formData = new FormData();
        formData.append("receiver_id", companionId);
        formData.append("product", productId);

        if (text.trim()) formData.append("text", text);

        // Картинки отправляем в 'files' (так как модель теперь MessageFile)
        files.forEach((file) => {
            formData.append("files", file);
            formData.append("file_types", "image");
        });

        // Если это голосовое
        if (audioFile) {
            formData.append("files", audioFile); 
            formData.append("file_types", "audio"); // Явно говорим серверу, что это аудио
            formData.append("durations", recordTime); // Передаем накопленное время записи
        }

        const res = await api.post("/messages/send/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        // ... WebSocket и остальная логика очистки
        wsRef?.current?.send(JSON.stringify({
            type: "product_message_created",
            message_id: res.data.id,
            receiver_id: companionId,
            product_id: productId,
        }));

        useProductStore.getState().addMessage(res.data);
        setText("");
        setFiles([]);
        setPreviewImages([]);
        setRecordTime(0); // Сбрасываем время
    } catch (err) {
        console.error("Ошибка при отправке сообщения:", err);
    }
};


 
    return (
         <div className={styles.mainContainer}>
            <div className={styles.inputWrapper}>
     

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

         {/* Микрофон + таймер
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
        </div> */}


        <div className={styles["send__clip"]}>
            <input
                id="inputFile"
                multiple
                type="file"
                accept="image/*"
                // onChange={(e) => setFiles(e.target.files)}

                onChange={(e) => {
                    const selectedFiles = Array.from(
                        e.target.files
                    );
                    setFiles(selectedFiles);

                    // создаем превью
                    const previews = selectedFiles.map((file) => ({
                        file,
                        url: URL.createObjectURL(file),
                        name: file.name,
                    }));

                    setPreviewImages(previews);
                }}
            />

            <label htmlFor="inputFile">
                <img src={clip} alt="" />
            </label>
        </div>

        <div className={styles.textContainer}>

       
            <input
                name="message_text"
                type="text"
                className={styles.textInput}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введите сообщение..."
                onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                }}
            />
       

        </div>

        <div >
            <button className={styles.sendBtn}
            onClick={sendMessage}
            >
                <img src={messageIcon} alt="" />
            </button>
        </div>
    </div>

    </div>
  );
}
