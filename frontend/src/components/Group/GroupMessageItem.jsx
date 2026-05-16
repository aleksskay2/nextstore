





import AudioPlayer from "../UI/AudioPlayer";
import React, { useEffect, useState,useRef , useCallback,useMemo} from "react";
import { formatDateLabel } from "../../utils/formatDateLabel";
import DoubleClickImage from "../../pages/Message/DoubleClickImage";
import styles from './GroupMessage.module.css';
import api from "../../api/axios";
import { useGroupsStore } from "../store/groups.store";
import useLongPress from "../../hooks/useLongPress";
import { createPortal } from "react-dom";
import ContextMenuChat from "../UI/ContextMenuChat";
import { cn } from "../../utils/cn";

const GroupMessageItem = React.memo(function GroupMessageItem
      ({ msg, currentUser, userName }) {

     const [showReadBy, setShowReadBy] = useState(false);
     const [contexMenu, setContextMenu] = useState(false);
     const [menuPos, setMenuPos] = useState(null);

     const type = 'group'
// { x: number, y: number }


  // ✅ Получаем актуальное сообщение из стора
  const localMsg = useGroupsStore(
    (s) => s.messages[msg.group]?.find((m) => m.id === msg.id) || msg,
    (a, b) => a === b
  );

  const selectedMessage = useGroupsStore((s) => s.selectedMessage);
  const setSelectedMessage = useGroupsStore((s) => s.setSelectedMessage);
  const clearSelectedMessage = useGroupsStore((s) => s.clearSelectedMessage);
  const setReplyMessage = useGroupsStore((s) => s.setReplyMessage);
  // const deleteMessage = useGroupsStore((s) => s.deleteMessage);
  const setOpenReadedLists = useGroupsStore((s) => s. setOpenReadedLists);

  const isOwn = localMsg.sender === currentUser;


  let isSelected = useGroupsStore(
    (s) => s.selectedMessage?.id === localMsg.id
  );

  const localReadBy = localMsg.read_by_users || [];

  const msgRef = useRef(null);
  // console.log('userName - ', userName)
  // console.log('render GroupMessageItem - ')


  // Мемоизируем список прочитавших (чтобы не пересчитывать каждый рендер)
  const readByUsers = useMemo(
    () => localReadBy.filter((u) => u !== userName),
    [localReadBy, userName]
  );


  const longPressHandlers = useLongPress(() => {
  setSelectedMessage(localMsg);
});

const closeContextMenu = () => {
  clearSelectedMessage();
  setOpenReadedLists(false);
};


// Пункт "Копировать"
const handleCopyMessage = useCallback((e) => {
  e.stopPropagation();

  if (localMsg.text) {
    navigator.clipboard.writeText(localMsg.text)
      .then(() => {
        console.log("Сообщение скопировано!");
      })
      .catch((err) => {
        console.error("Ошибка копирования:", err);
      });
  }

  closeContextMenu()
}, [localMsg.text]);

  const handleAnswer = (e) => {
    e.stopPropagation();
    setReplyMessage(msg); 
     closeContextMenu()
  }

  const deleteMessageRequest = async (messageId) => {
      try {
        const res = await api.delete(`group-messages/${messageId}/`);
      } catch (err) {
        console.error("Ошибка удаления сообщения", err);
      }
    }


  const handleDelete = (e) => {
    e.stopPropagation()
    // deleteMessage(msg.group, msg.id)
   
    deleteMessageRequest(msg.id)
    closeContextMenu()
  }



  // Выбор / снятие выделения
  const handleSelectMessage = useCallback(
  (e) => {
    e.preventDefault(); // Важно: отключаем стандартное меню браузера
    e.stopPropagation(); // Добавьте это, чтобы document.click не
    setMenuPos({
    x: e.clientX,
    y: e.clientY,
  });
    e.preventDefault(); // отключаем браузерное меню

    if (isSelected) {
      clearSelectedMessage();
    } else {
      setSelectedMessage(localMsg);
    }
  },
  [isSelected, localMsg, setSelectedMessage, clearSelectedMessage]
);


  const handleCloseReadBy = useCallback(() => setShowReadBy(false), []);


  // Закрытие popup при клике вне
 useEffect(() => {
  const handleClickOutside = () => {
    closeContextMenu();
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);



  const handleOpenReadList = () => {
    setSelectedMessage(localMsg);     // 👈 гарантируем
    setOpenReadedLists(true);    // 👈 всегда открываем
  }



  const openFullscreen = useCallback((el) => {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }, []);




  //   useEffect(() => {
  //     // console.log('msg - ', msg)
  //     // console.log('msg - ', msg)
  // }, []);


  const hasMedia = msg.files && msg.files.length > 0;
  // Если есть только файл и нет текста, убираем внутренние отступы
  const noPadding = hasMedia && !msg.text;


  return (
     <> 

       
    




    {msg.reply_to_data && (
  <div className={`${styles.replyBubble} ${isOwn ? styles["replyBubble-own"] : styles["replyBubble-other"]}`}>

    <div className={styles.replyContent}>
      <div className={styles.replyUser}>
        {msg.reply_to_data.sender_username}
      </div>

      {msg.reply_to_data.text && (
        <div className={styles.replyText}>
          {msg.reply_to_data.text}
        </div>
      )}

      {!msg.reply_to_data.text && msg.reply_to_data.file_type === "image" && (
        <div className={styles.replyFile}>
          <img
            src={msg.reply_to_data.file_url}
            className={styles.replyThumb}
          />
        </div>
      )}

      {!msg.reply_to_data.text && msg.reply_to_data.file_type === "video" && (
        <div className={styles.replyFile}>
          видео
           <video
            src={msg.reply_to_data.file_url}
            className={styles.replyThumb}
            muted
            preload="metadata"
          />
          
        </div>
      )}

      {!msg.reply_to_data.text && msg.reply_to_data.file_type === "audio" && (
        <div className={styles.replyFile}>
          🎤 Голосовое сообщение
        </div>
      )}
    </div>
  </div>
)}




         

      <div onContextMenu={handleSelectMessage}   
          ref={msgRef}
          
          className={`
            ${styles.chat__message}
            ${isOwn ? styles.own : styles.other}
            ${isSelected ? styles.selected : ""}
            
          `}
          >
          
       
 
        <div className={cn(
          styles.chat__text, 
          isOwn ? styles["color-text"] : styles.sender,
          isOwn && noPadding ? styles.noPadding :styles["padding__text"] // Применяем стиль без отступов
        )}>

          {!isOwn && <div className={styles.sender_name}>{msg.sender_username}</div>}

          {msg.files?.map(file => {
            if (file.type === "image") return <DoubleClickImage key={file.id} src={file.file} />;
            if (file.type === "video") {
              return (
                <video
                  key={file.id}
                  src={file.file}
                  preload="metadata"
                  playsInline
                  controlsList="nodownload"
                  controls
                  
                  onClick={
                    e => e.detail === 2 && openFullscreen(e.currentTarget)
                  }
                  style={{ maxWidth: "250px", borderRadius: "8px", cursor: "pointer" }}
                />
              );
            }
            if (file.type === "audio") return <AudioPlayer key={file.id} file={file} />;
            return null;
          })}

          {msg.text && (
            <span  style={{ cursor: "pointer" }}>
              {msg.text}
            </span>
          )}

          
          {isSelected && (
                createPortal(
          <div 
              style={{
            top: menuPos.y,
            left: menuPos.x,}} 
              onClick={(e) => e.stopPropagation()} // 🔥 КЛЮЧ
            className={`${styles["chat__answer"]} ${isOwn ? styles.delete  : ""}`} >
            
         

            <ContextMenuChat isOwn={isOwn} onAnswer={handleAnswer} 
              onDelete={handleDelete}
              onCopy={handleCopyMessage}
              onOpenReadList={handleOpenReadList}
              styles={styles}
              type={type}
              />

          
            
          </div>,
           document.body
          )
          
        )
        
      }
     
        


        
         {/* {isOwn && (
        <div style={{ fontSize: "12px", color: "#777", marginTop: 4, cursor: "pointer" }}
            onClick={handleLongPress}>
          {localReadBy.length > 0 ? "Прочитано" : "Еще не прочитано"}
        </div>
      )} */}

      { isOwn && showReadBy && localReadBy.length > 0 && (
        <div style={{
          position: "absolute",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "8px",
          fontSize: 12,
          color: "#555",
          zIndex: 10,
        }}>
           { readByUsers.length > 0 ? (
            <div style={{ padding: "4px 0" }}>
              <strong>Прочитали:</strong>0
              {readByUsers.map((username, i) => (
                <div key={i}>{username}</div> // каждый username на отдельной строкве
              ))}
            </div>
          ) : (
          
            "Еще не прочитано"
          )} 

          <div style={{ marginTop: 4, textAlign: "right", cursor: "pointer" }}
              onClick={(e) => {
                  e.stopPropagation(); // 🔥 остановка всплытия
                  handleCloseReadBy();
                }}
              
              >
            Закрыть
          </div>
        </div>
      )}
    </div>
      </div>

    </>
  );
})
export default GroupMessageItem;