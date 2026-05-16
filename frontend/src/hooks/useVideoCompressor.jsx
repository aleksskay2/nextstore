import { useState } from "react";
export function useVideoCompressor() {
  const [loading, setLoading] = useState(false);

  const compressVideo = async (file, outputName = "output.mp4") => {
    setLoading(true);

    // 🔥 Динамический импорт для Vite
    const ffmpegModule = await import("@ffmpeg/ffmpeg");
    const { createFFmpeg, fetchFile } = ffmpegModule.default || ffmpegModule; // вот это важно

    const ffmpeg = createFFmpeg({ log: true });

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    ffmpeg.FS("writeFile", file.name, await fetchFile(file));

    await ffmpeg.run(
      "-i",
      file.name,
      "-vcodec",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "fast",
      "-acodec",
      "aac",
      "-b:a",
      "64k",
      "-vf",
      "scale=640:-2",
      outputName
    );

    const data = ffmpeg.FS("readFile", outputName);
    const compressedFile = new File([data.buffer], outputName, { type: "video/mp4" });

    setLoading(false);
    return compressedFile;
  };

  return { compressVideo, loading };
}

