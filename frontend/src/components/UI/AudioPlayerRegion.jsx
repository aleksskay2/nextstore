import { useRef, useState, useEffect } from "react";
import styles from './AudioPlayerRegion.module.css'

export function AudioPlayerRegion({ src }) {
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
        <div className={styles.voiceAudio}>
            <audio 
                ref={audioRef} 
                src={src} 
                onTimeUpdate={handleTimeUpdate} 
                onEnded={() => setIsPlaying(false)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                    onClick={togglePlay}
                    style={{ border: "none", background: "#4caf50", color: "white",
                         borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer" }}
                >
                    {isPlaying ? "⏸" : "▶"}
                </button>
                <div style={{ flex: 1, height: "4px", background: "#ccc", 
                    borderRadius: "2px", position: "relative" }}>
                    <div 
                        style={{ 
                            width: `${progress}%`, 
                            height: "100%", 
                            background: "#4caf50", 
                            borderRadius: "2px",
                            transition: "width 0.1s linear" 
                        }} 
                    />
                </div>
            </div>
        </div>
    );
}