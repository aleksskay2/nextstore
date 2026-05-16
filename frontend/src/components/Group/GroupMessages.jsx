



import {  useRef, useEffect } from "react";
import { useGroupsStore } from "../store/groups.store";
import { formatDateLabel } from "../../utils/formatDateLabel";
import DoubleClickImage from "../../pages/Message/DoubleClickImage";
import styles from './GroupMessage.module.css';
import React from "react";


import GroupMessageItem from "./GroupMessageItem";




export default function GroupMessages({ currentUser, groupId , messageRefs,  userName }) {
  // const messages = useGroupsStore((s) => s.messages[groupId] || []);

  const messages = useGroupsStore(
  (s) => s.messages[groupId],
  (oldMessages, newMessages) => oldMessages === newMessages
) || [];


  const isNewDay = () => {
      if (index === 0) return true;
      const prev = new Date(messages[index - 1].created_at).toDateString();
      const current = new Date(msg.created_at).toDateString();
      return prev !== current;
    };

  //  {isNewDay() && (
  //       <small className={styles.chat__date}>
  //         {formatDateLabel(msg.created_at)}
  //       </small>
  //     )}

  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  console.log('render GroupMessage')
  // Автоскролл только если пользователь почти внизу
  // useLayoutEffect(() => {
  //   if (!bottomRef.current || !containerRef.current) return;
  //   const el = containerRef.current;
  //   const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;

  //   if (isAtBottom) {
  //     bottomRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [messages]);


   // Автоскролл при новом сообщении
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  }, [messages]);


  return (
    <div ref={containerRef} className={styles["container-message"]}>
      {messages.map((msg, index) => {
        if (!messageRefs.current[msg.id]) {
          messageRefs.current[msg.id] = React.createRef();
        }

        const showDate =
          index === 0 ||
          new Date(messages[index - 1].created_at).toDateString() !==
            new Date(msg.created_at).toDateString();

        return (
          <div key={msg.id} ref={messageRefs.current[msg.id]}>
            {showDate && (
              <small className={styles.chat__date}>
                {formatDateLabel(msg.created_at)}
              </small>
            )}

            <GroupMessageItem
              msg={msg}
              currentUser={currentUser}
              userName={userName}
            />
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
