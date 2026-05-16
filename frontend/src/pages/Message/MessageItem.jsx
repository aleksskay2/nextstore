import { useState, useEffect, useCallback } from "react";
import { formatDateLabel } from "../../utils/formatDateLabel";
import { useChatStore } from "../../components/store/useChatStore";
import MessageStatus from "./MessageStatus";
import AudioPlayer from "../../components/UI/AudioPlayer";
import DoubleClickImage from "./DoubleClickImage";


import styles from './MessageItem.module.css'

export default function MessageItem({ index, msg, messages, userId }) {
    const [menuPos, setMenuPos] = useState(null);
    const isOwn = msg.is_own;
    const type = 'private'

    const {
        selectedMessage,
        setSelectedMessage,
        clearSelectedMessage,
        deleteMessageForAll,
        setReplyMessage,
    } = useChatStore();

    const isSelected = selectedMessage?.id === msg.id;

    const closeMenu = useCallback(() => {
        clearSelectedMessage();
        setMenuPos(null);
    }, [clearSelectedMessage]);

    // Обработчик правого клика
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setSelectedMessage(msg);
    }, [msg, setSelectedMessage]);

    // Функции действий
    const handleCopy = (e) => {
        e.stopPropagation();
        if (msg.text) {
            navigator.clipboard.writeText(msg.text);
        }
        closeMenu();
    };

    const handleAnswer = (e) => {
        e.stopPropagation();
        setReplyMessage?.(msg);
        closeMenu();
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        deleteMessageForAll(msg.id);
        closeMenu();
    };

    // Закрытие меню при клике вне его
    useEffect(() => {
        if (!isSelected) return;

        const handleGlobalClick = (e) => {
            // Если клик был не по меню, закрываем его
            closeMenu();
        };

        // Используем setTimeout, чтобы текущий клик не закрыл меню сразу
        const timer = setTimeout(() => {
            document.addEventListener("click", handleGlobalClick);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("click", handleGlobalClick);
        };
    }, [isSelected, closeMenu]);

    const openFullscreen = (el) => {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    };

    const isNewDay = (messages, index) => {
        if (index === 0) return true;
        const prev = new Date(messages[index - 1].created_at).toDateString();
        const current = new Date(messages[index].created_at).toDateString();
        return prev !== current;
    };


       useEffect(()=> {
        console.log('msg' , msg)
    },[])
    

    // Общая логика рендера контента (файлы + текст)
    const renderMessageBody = () => (
        <div className={msg.text ? styles.chat__text : styles.fileItem}>

            {/* 🔥 Отображение "Ответа" внутри сообщения */}
            {msg.reply_to && (
                <div className={styles.replyPreviewBar}>
                    <small>{msg.reply_to_data.sender_username || 'Ответ'}</small>
                    <p>{msg.reply_to_data?.text?.substring(0, 50)}...</p>
                </div>
            )}

            {msg.files?.map(file => {
                if (file.type === "image") return <DoubleClickImage key={file.id} src={file.file} />;
                if (file.type === "video") return (
                    <video key={file.id} src={file.file} controls 
                        onClick={(e) => e.detail === 2 && openFullscreen(e.currentTarget)} 
                    />
                );
                if (file.type === "audio") return <AudioPlayer key={file.id} file={file} />;
                return null;
            })}
            
            {msg.text && <span>{msg.text}</span>}

            <div className={styles.statusContainer}>
                <span className={styles.time}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {isOwn && (
                    <MessageStatus isDelivered={msg.is_delivered} isRead={msg.is_read} />
                )}
            </div>
        </div>
    );

    return (
        <div className={styles.messageRow}>
            {isNewDay(messages, index) && (
                <small className={styles["chat__date"]}>
                    {formatDateLabel(msg.created_at)}
                </small>
            )}

            <div 
                onContextMenu={handleContextMenu}
                className={`
                    ${styles.chat__message} 
                    ${isOwn ? styles.own : styles.other} 
                    ${isSelected ? styles.selected : ""}
                `}
            >
                {renderMessageBody()}
                
                {/* Меню рендерится через портал, если это сообщение выбрано */}
                {isSelected && menuPos && createPortal(
                    <div
                        style={{ 
                            position: 'fixed', 
                            // Ограничиваем, чтобы меню не уходило ниже экрана
                            top: Math.min(menuPos.y, window.innerHeight - 150), 
                            // Ограничиваем, чтобы не уходило за правый край
                            left: Math.min(menuPos.x, window.innerWidth - 180), 
                            zIndex: 10000 
                        }}
                        onClick={(e) => e.stopPropagation()} // Важно!
                         className={`${styles["chat__answer"]} ${isOwn ? styles.delete  : ""}`} >

                    
                        <ContextMenuChat
                            isOwn={isOwn}
                            onCopy={handleCopy}
                            onAnswer={handleAnswer}
                            onDelete={handleDelete}
                            styles={styles}
                            type={type}
                        />
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}






