
import { useState, useRef } from "react";
import {cn} from  "../../utils/cn";

import clip from "../../assets/icons/clip.png"
import messageIcon from "../../assets/icons/arrow_message.png"
import styles from '../Story/MessageStory.module.css'
import { useChatStore } from "../store/useChatStore";
import voiceMicrophone from "../../assets/icons/voiceMicrophone.png";






export default function ChatInputStory({
    sendMessage,
    previews,
    removePreview,
    handleFileChange,
    startRecording,
    stopRecording,
    recording
   
}) {
    const text = useChatStore(state => state.text);
    const setText = useChatStore(state => state.setText);
    const clearText = useChatStore(state => state.clearText);

    const [recordTime, setRecordTime] = useState(0);
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
            {/* Микрофон + таймер */}
            {/* <div className={styles["microphone__content"]}>
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

            {/* Превью файлов
            {previews.length > 0 && (
                <div className={styles.priview}>
                    {previews.map((p, i) => (
                        <div key={i} style={{ position: "relative" }}>
                            <img
                                src={p.url}
                                style={{ width: 80, height: 80 }}
                            />
                            <button onClick={() => removePreview(i)}>
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )} */}


            {previews.length > 0 && (
    <div className={styles.priview}>
        {previews.map((p, i) => (
            <div
                key={i}
                style={{
                    position: "relative",
                    width: 80,
                    height: 80,
                }}
            >
                {/* 🖼 IMAGE */}
                {p.type === "image" && (
                    <img
                        src={p.url}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 8,
                        }}
                    />
                )}

                {/* 🎬 VIDEO */}
                {p.type === "video" && (
                    <video
                        src={p.url}
                        muted
                        playsInline
                        preload="metadata"
                        controls
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 8,
                        }}
                    />
                )}

                {/* 🎧 AUDIO */}
                {p.type === "audio" && (
                    <audio
                        src={p.url}
                        controls
                        style={{ width: "100%" }}
                    />
                )}

                <button
                    onClick={() => removePreview(i)}
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
                        cursor: "pointer",
                    }}
                >
                    ×
                </button>
            </div>
        ))}
    </div>
)}




            {/* Input + отправка */}
            <div className={cn(styles.chat__send, styles.send)}>

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

            
                <div className={styles["send__clip"]}>
                    <input
                        id="inputFile"
                        multiple
                        type="file"
                        accept="image/*,video/*,audio/*"
                        
                        onChange={handleFileChange}
                    />
                    <label htmlFor="inputFile">
                        <img src={clip} alt="" />
                    </label>
                </div>

                <div className={styles["input__message"]}>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Введите сообщение..."
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                </div>

                <div className={styles["send__message"]}>
                    <button onClick={sendMessage}>
                        <img src={messageIcon} alt="" />
                    </button>
                </div>
            </div>
        </>
    );
}





