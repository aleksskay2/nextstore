import React, { useEffect } from 'react'
import { useRef } from 'react'
import { useProductStore } from '../../components/store/useProductStore'
import { formatDateLabel } from '../../utils/formatDateLabel'
import MessageStatus from './MessageStatus'
import VoiceMessage from '../../components/UI/VoiceMessage'
import styles from  "./MessageList.module.css"
import AudioPlayer from '../../components/UI/AudioPlayer'
import MessageItem from './MessageItem'
import { cn } from '../../utils/cn'

const MessageList = ({ userId}) => {

    const messages = useProductStore(s => s.messages)
    

    useEffect(() => {
        console.log('messages', messages)
    },[messages])

    const chatRef = useRef()

   // 🔥 Эффект для автопрокрутки вниз
    useEffect(() => {
        if (chatRef.current) {
            const container = chatRef.current;
            
            // Используем scrollTo для перемещения в самый низ
            // Если сообщений много, лучше 'auto' для первого раза и 'smooth' для новых
            container.scrollTo({
                top: container.scrollHeight,
                behavior: messages.length <= 20 ? "auto" : "smooth", 
            });
        }
    }, [messages]); // Следим за изменением массива сообщений

return (
    // <div className={styles["chat"]}>
    //   {messages.map((msg, index) => {
    //     const showDate =
    //       index === 0 ||
    //       new Date(messages[index - 1].created_at).toDateString() !==
    //         new Date(msg.created_at).toDateString();

    //     // Проверяем, является ли сообщение "своим"
    //     // (убедитесь, что в сериализаторе или сторе проставлено is_own)
    //     const isOwn =  msg.is_own;

    //     return (
    //       <div className={styles.messageRow}
    //       key={msg.id || index}>
    //         {showDate && (
    //           <div className={styles["chat__date"]}>
    //             <small>{formatDateLabel(msg.created_at)}</small>
    //           </div>
    //         )}

    //         <div
    //           className={`${styles.chat__message} ${
    //             isOwn ? styles.own : styles.other
    //           }`}
    //         >
    //           <div
               
    //           >
    //             {/* {msg.text && <p className={styles.text__content}>{msg.text}</p>} */}

    //             {/* Рендеринг файлов из новой модели MessageFile */}
                
    //              <div className={msg.text ? styles.chat__text : styles.fileItem}>
                
    //               {msg.files?.map(file => {
    //             if (file.type === "image") return <DoubleClickImage key={file.id} src={file.file} />;
    //             if (file.type === "video") return (
    //                 <video key={file.id} src={file.file} controls 
    //                     onClick={(e) => e.detail === 2 && openFullscreen(e.currentTarget)} 
    //                 />
    //             );
    //             if (file.type === "audio") return <AudioPlayer key={file.id} file={file} />;
    //             return null;
    //         })}
            
    //       </div>

              
    //         {msg.text && <span>{msg.text}</span>}

    //         <div className={styles.statusContainer}>
    //             <span className={styles.time}>
    //                 {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    //             </span>
    //             {isOwn && (
    //                 <MessageStatus isDelivered={msg.is_delivered} isRead={msg.is_read} />
    //             )}
    //         </div>
    //           </div>
    //         </div>
    //       </div>
    //     );
    //   })}
    // </div>

   <>
      {/* /* 🔥 Привязываем ref и добавляем класс со скроллом */ }
        <div className={styles.chatMessagesContainer} ref={chatRef}  >
            {messages.map((msg, index) => (
                <MessageItem
                    key={msg.id || msg.temp_id || index}
                    msg={msg}
                    messages={messages}
                    styles={styles}
                    index={index}
                    userId={userId}
                />
            ))}
        </div>
         
    </>
  );
};



export default MessageList