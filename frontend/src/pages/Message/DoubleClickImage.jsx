import { useState, useRef } from "react";
import styles from './ChatPage.module.css'

const DoubleClickImage = ({src, onDoubleClick}) => {
    const [lastTap, setLastTap] = useState(0)
    const clickTimeout = useRef(null);

    const handleClick = () => {
        const now = Date.now();
        if (now - lastTap < 300)
        {
            clearTimeout(clickTimeout.current)
            onDoubleClick(); 
        } 
        else {
            clickTimeout.current = setTimeout(() => {
                // тут можно добавить обычное действие по клику
            }, 300);
        }
        setLastTap(now)
    }
    return (
        <img 
            src={src} 
            alt='no image'
             height={250} width={250}
            className={styles['chat__images']}
            onClick={handleClick} 
        />
    )
    


}
export default DoubleClickImage;

