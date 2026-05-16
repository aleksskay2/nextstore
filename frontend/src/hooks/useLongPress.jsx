import { useRef } from "react";
function useLongPress(callback, ms = 10) {
  const timerRef = useRef(null);

  const start = () => {
    timerRef.current = setTimeout(callback, ms);
  };

  const clear = () => {
    clearTimeout(timerRef.current);
  };

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onTouchCancel: clear,
  };
}

export default useLongPress;