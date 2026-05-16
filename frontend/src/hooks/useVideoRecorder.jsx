import { useRef, useState } from "react";

export function useVideoRecorder() {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

     // ✅ Safari / Chrome / Firefox fallback
    const mimeType = MediaRecorder.isTypeSupported(
      "video/webm; codecs=vp9,opus"
    )
      ? "video/webm; codecs=vp9,opus"
      : MediaRecorder.isTypeSupported(
          "video/webm; codecs=vp8,opus"
        )
      ? "video/webm; codecs=vp8,opus"
      : "video/webm";

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm; codecs=vp9,opus",
      videoBitsPerSecond: 800_000, // 🔥 сжатие видео
      audioBitsPerSecond: 64_000
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
          type: "video/webm"
        });

        const file = new File(
          [blob],
          `video_${Date.now()}.webm`,
          { type: "video/webm" }
        );

        // выключаем камеру
        streamRef.current.getTracks().forEach(t => t.stop());

        setRecording(false);
        resolve(file);
      };

      mediaRecorderRef.current.stop();
    });

  return { recording, startRecording, stopRecording };
}
