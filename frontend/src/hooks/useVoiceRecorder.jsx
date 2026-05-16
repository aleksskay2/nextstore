

import { useRef, useState } from "react";

export function useVoiceRecorder() {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    // ✅ Safari / Chrome / Firefox fallback
    const mimeType = MediaRecorder.isTypeSupported(
      "audio/webm; codecs=opus"
    )
      ? "audio/webm; codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/mp4"; // крайний fallback (iOS)

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType,
      audioBitsPerSecond: 32_000 // 🔥 ОЧЕНЬ маленький размер
    });

    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
  };

  const stopRecording = () =>
    new Promise((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current.mimeType
        });

        const ext = blob.type.includes("mp4") ? "m4a" : "webm";

        const file = new File(
          [blob],
          `voice_${Date.now()}.${ext}`,
          { type: blob.type }
        );

        // 🛑 выключаем микрофон
        streamRef.current.getTracks().forEach(t => t.stop());

        setRecording(false);
        resolve(file);
      };

      mediaRecorderRef.current.stop();
    });

  return { recording, startRecording, stopRecording };
}
