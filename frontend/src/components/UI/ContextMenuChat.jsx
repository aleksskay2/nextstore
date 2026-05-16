import React, { useEffect } from "react";
// import styles from "./ChatMessageActions.module.css";

const ContextMenuChat = ({
  isOwn,
  onAnswer,
  onDelete,
  onCopy,
  onOpenReadList,
  styles,
  type
}) => {

  useEffect(() => {
    console.log("isOwn", isOwn)
  },[])

  return (
    <div
      className={
        isOwn ? styles["chat__own-message"] : styles["chat__other-message"]
      }
    >
      <button onPointerDown={onAnswer}>Ответить</button>

      {isOwn && (
        <button onPointerDown={onDelete}>Удалить</button>
      )}

      <button onPointerDown={onCopy}>Копировать</button>
      {
          type === 'group' && <button onPointerDown={onOpenReadList}>Прочитано</button>
      }
      
    </div>
  );
};

export default ContextMenuChat;
