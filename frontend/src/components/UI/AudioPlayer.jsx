import { useEffect, useRef, useState } from "react";
import styles from "./AudioPlayer.module.css";
import { FaPause, FaPlay } from "react-icons/fa";

function formatTime(sec = 0) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

// export default function AudioPlayer({ file }) {
//     const audioRef = useRef(null);
//     const [played, setPlayed] = useState(0);
//     const [isPlaying, setIsPlaying] = useState(false);

//     // Определяем, какое время показывать:
//     // Если аудио стоит на месте и прогресс 0 — показываем общую длительность.
//     // Если начали играть (played > 0) — показываем текущий прогресс.
//     const displayTime = played > 0 ? played : (file.duration || 0);

//     const toggle = () => {
//         const audio = audioRef.current;
//         if (!audio) return;

//         isPlaying ? audio.pause() : audio.play();
//         setIsPlaying(!isPlaying);
//     };

//     useEffect(() => {
//         const audio = audioRef.current;
//         if (!audio) return;

//         const update = () => setPlayed(audio.currentTime);
//         const stop = () => {
//             setIsPlaying(false);
//             setPlayed(0); // Сбрасываем в 0, чтобы снова отобразилась общая длительность
//         };

//         audio.addEventListener("timeupdate", update);
//         audio.addEventListener("ended", stop);

//         return () => {
//             audio.removeEventListener("timeupdate", update);
//             audio.removeEventListener("ended", stop);
//         };
//     }, []);

//     const progress = file.duration
//         ? Math.min((played / file.duration) * 100, 100)
//         : 0;

//     return (
//         <div className={styles.wrapper}>
//             <audio ref={audioRef} src={file.file} preload="metadata" />

//             <button className={styles.playBtn} onClick={toggle}>
//                 {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
//             </button>

//             <div className={styles.body}>
//                 <div className={styles.bar}>
//                     <div
//                         className={styles.fill}
//                         style={{ width: `${progress}%` }}
//                     />
//                 </div>
//             </div>

//             <div className={styles.time}>
//                 {/* Теперь здесь только один таймер */}
//                 {formatTime(displayTime)}
//             </div>
//         </div>
//     );
// }



export default function AudioPlayer({ file }) {
    const audioRef = useRef(null);
    const [played, setPlayed] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Логика отображения времени: 
    // Если проиграно 0 — общая длительность.
    // Если закончили играть (played >= duration) — тоже общая длительность.
    // В процессе — текущее время.
    const isEnded = file.duration && played >= file.duration - 0.1; // небольшой зазор для точности
    const displayTime = (played > 0 && !isEnded) ? played : (file.duration || 0);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            // Если аудио уже закончилось и мы нажали Play — начинаем сначала
            if (audio.currentTime >= audio.duration) {
                audio.currentTime = 0;
                setPlayed(0);
            }
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const update = () => setPlayed(audio.currentTime);
        const stop = () => {
            setIsPlaying(false);
            // 🔥 Убрали setPlayed(0), чтобы полоска не прыгала назад
        };

        audio.addEventListener("timeupdate", update);
        audio.addEventListener("ended", stop);

        return () => {
            audio.removeEventListener("timeupdate", update);
            audio.removeEventListener("ended", stop);
        };
    }, []);

    const progress = file.duration
        ? Math.min((played / file.duration) * 100, 100)
        : 0;

    return (
        <div className={styles.wrapper}>
            <audio ref={audioRef} src={file.file} preload="metadata" />

            <button className={styles.playBtn} onClick={toggle}>
                {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
            </button>

            <div className={styles.body}>
                <div className={styles.bar}>
                    <div
                        className={styles.fill}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className={styles.time}>
                {formatTime(displayTime)}
            </div>
        </div>
    );
}