import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { FaPlay, FaPause } from 'react-icons/fa';

const VoiceMessage = ({ audioUrl, duration, styles }) => {
  const containerRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  

    useEffect(() => {
  if (!containerRef.current) return;

  let isCancelled = false;
  // Небольшая задержка перед созданием тяжелого объекта WaveSurfer
  const timer = setTimeout(() => {
    if (isCancelled) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#d1d1d1',
      progressColor: '#5856d6',
      cursorWidth: 0,
      barWidth: 2,
      barRadius: 3,
      height: 30,
      normalize: true,
      interact: true, // Позволяет кликать по волне для перемотки
    });

    wavesurfer.current.load(audioUrl).catch((err) => {
      // Тихий отлов AbortError, чтобы не спамить в консоль
      if (err.name !== 'AbortError') {
        console.error('WaveSurfer error:', err);
      }
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('finish', () => setIsPlaying(false));
  }, 50); // 50мс достаточно, чтобы пропустить "мигание" StrictMode

  return () => {
    isCancelled = true;
    clearTimeout(timer);
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }
  };
}, [audioUrl]);


  const togglePlay = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Чтобы не срабатывал клик по сообщению
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  return (
    <div className={styles.voiceMessage} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={togglePlay} className={styles.playBtn}>
        {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
      </button>
      <div 
        ref={containerRef} 
        className={styles.waveContainer} 
        style={{ minWidth: '150px' }} 
      />
      {duration && <span className={styles.voiceDuration}>{duration}с</span>}
    </div>
  );
};

export default VoiceMessage;