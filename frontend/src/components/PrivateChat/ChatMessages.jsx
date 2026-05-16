import { memo } from "react";
import ChatMessageItem from "./ChatMessageItem";
import { useEffect } from "react";
import { cn } from "../../utils/cn";

const ChatMessages = memo(function ChatMessages({
    messages,
    chatRef,
    onScroll,
    className, // Используем className для внешних стилей (isReady)
    styles,
    userId,
}) {


    /// Логика определения нового дня
    const isNewDay = (messages, index) => {
        if (index === 0) return true;
        const prevDate = new Date(messages[index - 1].created_at).toDateString();
        const currentDate = new Date(messages[index].created_at).toDateString();
        return prevDate !== currentDate;
    };

    // Автопрокрутка вниз
    useEffect(() => {
        if (chatRef?.current) {
            const container = chatRef.current;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth", 
            });
        }
    }, [messages, chatRef]);

    return (
        <div className={cn(styles.chat, className)} ref={chatRef} onScroll={onScroll}>
            {messages.map((msg, index) => {
                // Вычисляем здесь один раз для каждого элемента
                const showDate = isNewDay(messages, index);

                return (
                    <ChatMessageItem
                        key={msg.id || msg.temp_id}
                        msg={msg}
                        // Теперь передаем только результат, а не весь массив
                        showDate={showDate} 
                        styles={styles}
                        userId={userId}
                        // index больше не нужен внутри Item, если он использовался только для даты
                    />
                );
            })}
        </div>
    );
});

export default ChatMessages;