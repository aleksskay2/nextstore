


// import styles from "./PrivateChat.module.css";
// import { cn } from "../../utils/cn";
// import api from "../../api/axios";
// import MessageStatus from "../../pages/Message/MessageStatus";
// import DoubleClickImage from "../../pages/Message/DoubleClickImage";
// import clip from '../../assets/icons/clip.png'
// import messageIcon from "../../assets/icons/arrow_message.png"
// import useStore from "../store/store";
// import { useProductFilter } from "../store/UseProductFilter";
// import { useChatStore } from "../store/useChatStore";
// import ChatInput from "./ChatInput";




import React, { useEffect, useState,useRef , useCallback,useMemo} from "react";
import { createPortal } from "react-dom";
import ContextMenuChat from "../UI/ContextMenuChat";
import DoubleClickImage from "../../pages/Message/DoubleClickImage"
import MessageStatus from "../../pages/Message/MessageStatus"
import { formatDateLabel } from "../../utils/formatDateLabel";
import AudioPlayer from '../UI/AudioPlayer'
import { useChatStore } from "../store/useChatStore";
// import styles from './chat'


// export default function ChatMessageItem({ index, msg, messages, styles, userId }) {
   

//     const videoRef = useRef(null);

//       const isNewDay = (messages, index) => {
//             if (index === 0) return true;  
//             const prev = new Date(messages[index - 1].created_at).toDateString();
//             const current = new Date(messages[index].created_at).toDateString();
//             return prev !== current;
//         };

        
//     const openFullscreen = (el) => {
//         alert('sadf')
//         if (el.requestFullscreen) {
//             el.requestFullscreen();
//         } else if (el.webkitRequestFullscreen) { // Safari
//             el.webkitRequestFullscreen();
//         } else if (el.msRequestFullscreen) { // IE/Edge old
//             el.msRequestFullscreen();
//         }
//     };

//      const handleVideoDoubleClick = () => {
//         if (videoRef.current) {
//             openFullscreen(videoRef.current);
//         }
//     };


//     // useEffect(() => {
//     //     console.log('messages - ', msg)
       
//     // }, [])



//     return (
//         <div   >
          

//             {
//                 isNewDay(messages, index) && (
//                     <small className={styles["chat__date"]}>
//                     {formatDateLabel(msg.created_at)}
//                 </small>
//                 )
//             }

//             <div
//                 className={`${styles.chat__message} ${
//                     msg.is_own ? styles.own : styles.other
//                 }`}
                 
//             >
//                 <div
//                     className={`${styles.chat__text} ${
//                         msg.is_own ? styles["color-text"] : styles.sender
//                     }`}
//                 >
                   
//                     {/* {msg.files?.map(file => {
//                         if (file.type === "image") {
//                             return <DoubleClickImage key={file.id} src={file.file} />;
//                         }

//                         if (file.type === "audio") {
//                             return <AudioPlayer key={file.id} file={file} />;
//                         }

//                         return null;
//                     })} */}


//                 {msg.files?.map(file => {
//                     if (file.type === "image") {
//                         return <DoubleClickImage key={file.id} src={file.file} />;
//                     }

//                     if (file.type === "video") {
//                         return (
//                            <video
//                                 src={file.file}
//                                 controls
//                                 onClick={(e) => {
//                                 if (e.detail === 2) {
//                                     openFullscreen(e.currentTarget);
//                                 }
//                             }}
//                                 // onDoubleClick={(e) => openFullscreen(e.currentTarget)}
//                                 style={{ maxWidth: "250px", borderRadius: "8px", cursor: "pointer" }}
//                             />
//                         );
//                     }

//                     if (file.type === "audio") {
//                         return <AudioPlayer key={file.id} file={file} />;
//                     }

//                     return null;
//                 })}



//                     {msg.text && <span>{msg.text}</span>}

//                     {/* ✅ статус ТОЛЬКО для моих сообщений */}
//                     {msg.is_own && (
//                        <MessageStatus
//                             isDelivered={msg.is_delivered}
//                             isRead={msg.is_read}
//                         />
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }








import styles from './ChatMessageItem.module.css'
// import { useChatStore } from "../store/useChatStore";


// export default function ChatMessageItem({ index, msg, messages, userId }) {
//     const videoRef = useRef(null);

//     const isNewDay = (messages, index) => {
//         if (index === 0) return true;
//         const prev = new Date(messages[index - 1].created_at).toDateString();
//         const current = new Date(messages[index].created_at).toDateString();
//         return prev !== current;
//     };

//     const openFullscreen = (el) => {
//         if (el.requestFullscreen) el.requestFullscreen();
//         else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
//     };


//     const msgRef = useRef(null);
//     const [menuPos, setMenuPos] = useState(null);

//     const isOwn = msg.is_own;

//     const {
//         selectedMessage,
//         setSelectedMessage,
//         clearSelectedMessage,
//         deleteMessageForAll,
//         setReplyMessage,
//     } = useChatStore();

//     const isSelected = selectedMessage?.id === msg.id;

//     // ---------- handlers ----------

//     const closeMenu = () => {
//         clearSelectedMessage();
//         setMenuPos(null);
//     };

//     const handleContextMenu = useCallback(
//         (e) => {
//         e.preventDefault();
//         setMenuPos({ x: e.clientX, y: e.clientY });
//         setSelectedMessage(msg);
//         },
//         [msg]
//     );

//     const handleCopy = useCallback((e) => {
//         e.stopPropagation();
//         if (msg.text) {
//         navigator.clipboard.writeText(msg.text);
//         }
//         closeMenu();

//         alert('safd')
//     }, [msg.text]);

//     const handleAnswer = useCallback((e) => {
        
//         e.stopPropagation();
//         setReplyMessage?.(msg);
//         closeMenu();
//     }, [msg]);

//     const handleDelete = useCallback((e) => {
//         alert('sdf')
//         e.stopPropagation();
//         deleteMessageForAll(msg.id);
//         closeMenu();
//     }, [msg.id]);

 

//     useEffect(() => {
//     const handleMouseDown = (e) => {
//         // ❗ правый клик игнорируем
//         if (e.button === 2) return;

//         closeMenu();
//     };

//     document.addEventListener("mousedown", handleMouseDown);
//     return () => document.removeEventListener("mousedown", handleMouseDown);
//     }, []);



//     // useEffect(()=> {
//     //     console.log('msg' , msg)
//     // },[])
    
//     return (
//         <div className={styles.messageRow}>
//             {isNewDay(messages, index) && (
//                 <small className={styles["chat__date"]}>
//                     {formatDateLabel(msg.created_at)}
//                 </small>
//             )}

//             {
//                 msg.text ? (  <div 
                
//         onContextMenu={handleContextMenu}
//         className={`
//           ${styles.chat__message}
//           ${isOwn ? styles.own : styles.other}
//           ${isSelected ? styles.selected : ""}
//         `}

//                 >
//                 <div className={styles.chat__text }>
                    
//                     {/* Рендер файлов */}
//                     {msg.files?.map(file => {
//                         if (file.type === "image") {
//                             return <DoubleClickImage key={file.id} src={file.file} />;
//                         }

//                         if (file.type === "video") {
//                             return (
//                                 <video
//                                     key={file.id}
//                                     src={file.file}
//                                     controls
//                                     onClick={(e) => {
//                                         if (e.detail === 2) openFullscreen(e.currentTarget);
//                                     }}
//                                 />
//                             );
//                         }

//                         if (file.type === "audio") {
//                             return <AudioPlayer key={file.id} file={file} />;
//                         }
//                         return null;
//                     })}

//                     {/* Текст сообщения */}
//                     {msg.text && <span>{msg.text}</span>}

//                      {!msg.is_own && (
//                         <div className={styles.statusContainer}>
//                              <span className={styles.time}>
//                                 {new Date(msg.created_at).toLocaleTimeString([], {
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                                 })}
//                             </span>
                            
                            

//                         </div>
//                     )}

//                     {/* CONTEXT MENU */}
//                     {isSelected && menuPos &&
//                     createPortal(
//                         <div
//                         style={{ 
//                             position: 'fixed', 
//                             top: menuPos.y, 
//                             left: menuPos.x, 
//                             zIndex: 10000 
//                         }}
//                         className={styles.contextMenuWrapper}
//                         onClick={(e) => e.stopPropagation()}
//                         >
//                         <ContextMenuChat
//                             isOwn={isOwn}
//                             onCopy={handleCopy}
//                             onAnswer={handleAnswer}
//                             onDelete={handleDelete}
//                             styles={styles}
//                         />
//                         </div>,
//                         document.body
//                     )}


                   
//                     {/* Статус сообщения (галочки) */}
//                     {msg.is_own && (
//                         <div className={styles.statusContainer}>
//                              <span className={styles.time}>
//                                 {new Date(msg.created_at).toLocaleTimeString([], {
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                                 })}
//                             </span>
                            
//                             <MessageStatus
//                                 isDelivered={msg.is_delivered}
//                                 isRead={msg.is_read}
//                             />
                            

//                         </div>
//                     )}
//                 </div>
//             </div>) :
            
//             (
//                  <div className={`${styles.chat__message} ${msg.is_own ? styles.own : styles.other}`}>
//                 <div className={styles.fileItem }>
                    
//                     {/* Рендер файлов */}
//                     {msg.files?.map(file => {
//                         if (file.type === "image") {
//                             return <DoubleClickImage key={file.id} src={file.file} />;
//                         }

//                         if (file.type === "video") {
//                             return (
//                                 <video
//                                     key={file.id}
//                                     src={file.file}
//                                     controls
//                                     onClick={(e) => {
//                                         if (e.detail === 2) openFullscreen(e.currentTarget);
//                                     }}
//                                 />
//                             );
//                         }

//                         if (file.type === "audio") {
//                             return <AudioPlayer key={file.id} file={file} />;
//                         }
//                         return null;
//                     })}

                 

//                     {/* Статус сообщения (галочки) */}
//                     {msg.is_own && (
//                         <div className={styles.statusContainer}>
//                             <MessageStatus
//                                 isDelivered={msg.is_delivered}
//                                 isRead={msg.is_read}
//                             />
//                         </div>
//                     )}
//                 </div>
//             </div>
//             )
               
//             }
           




//         </div>
//     );
// }












export default function ChatMessageItem({ index, msg, messages, userId , showDate}) {
   
    
    const [menuPos, setMenuPos] = useState(null);
    const isLongPressActive = useRef(null);

    // 2. АТОМАРНЫЕ СЕЛЕКТОРЫ (Самое важное!)
    // Теперь это сообщение рендерится только если поменялся ЕГО статус выбора
    const isSelected = useChatStore(state => state.selectedMessage?.id === msg.id);
    
    // Функции из стора берем отдельно. Они стабильны и не вызывают рендер при изменении текста
    const setSelectedMessage = useChatStore(state => state.setSelectedMessage);
    const clearSelectedMessage = useChatStore(state => state.clearSelectedMessage);
    const deleteMessageForAll = useChatStore(state => state.deleteMessageForAll);
    const setReplyMessage = useChatStore(state => state.setReplyMessage);

    const isOwn = msg.is_own;
    const type = 'private';

    const openMenu = useCallback((x, y) => {
        setMenuPos({ x, y });
        setSelectedMessage(msg);
    }, [msg, setSelectedMessage]);

    const closeMenu = useCallback(() => {
        clearSelectedMessage();
        setMenuPos(null);
        if (isLongPressActive.current) clearTimeout(isLongPressActive.current);
    }, [clearSelectedMessage]);

    // 3. Оптимизируем обработчик клика
    const handlePointerDown = useCallback((e) => {
        if (e.pointerType === "mouse" && e.button !== 2) return;
        
        // Для мобилок - эмуляция долгого нажатия без лишних ререндеров
        isLongPressActive.current = setTimeout(() => {
            openMenu(e.clientX, e.clientY);
            if (navigator.vibrate) navigator.vibrate(40);
        }, 500);
    }, [openMenu]);

    const handlePointerUp = useCallback(() => {
        if (isLongPressActive.current) clearTimeout(isLongPressActive.current);
    }, []);

    // Функции действий оборачиваем в useCallback, чтобы не создавать их заново
    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        deleteMessageForAll(msg.id);
        closeMenu();
    }, [msg.id, deleteMessageForAll, closeMenu]);

    const handleCopy = useCallback((e) => {
        e.stopPropagation();
        if (msg.text) navigator.clipboard.writeText(msg.text);
        closeMenu();
    }, [msg.text, closeMenu]);

    const handleAnswer = useCallback((e) => {
        e.stopPropagation();
        setReplyMessage?.(msg);
        closeMenu();
    }, [msg, setReplyMessage, closeMenu]);

    // Эффект на закрытие меню
    useEffect(() => {
        if (!isSelected) return;
        const handleGlobalClick = (e) => {
            if (!e.target.closest(`.${styles.chat__answer}`)) closeMenu();
        };
        const timer = setTimeout(() => {
            document.addEventListener("click", handleGlobalClick);
            document.addEventListener("touchstart", handleGlobalClick);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("click", handleGlobalClick);
            document.removeEventListener("touchstart", handleGlobalClick);
        };
    }, [isSelected, closeMenu, styles.chat__answer]);

    // Вспомогательная функция (лучше вынести за пределы компонента, если она статична)
   


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
            {showDate && (
            <small className={styles["chat__date"]}>
                {formatDateLabel(msg.created_at)}
            </small>
        )}

            <div 
               
                  onContextMenu={(e) => e.preventDefault()}
                    onPointerDown={handlePointerDown}
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






