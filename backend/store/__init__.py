
import subprocess
import json
def get_audio_duration(path: str) -> int | None:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "json",
                path,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        duration = float(json.loads(result.stdout)["format"]["duration"])
        return int(duration)
    except Exception:
        return None
