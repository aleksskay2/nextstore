import react from "react";
import { useState } from "react";

const PrivateChatDialogs = () => {

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            const res = await api.get("/private-chat/unread-count/");
            setUnreadCount(res.data.unread);
        };

        fetchUnread();

        // обновление каждые 10 секунд
        const timer = setInterval(fetchUnread, 10000);

        return () => clearInterval(timer);
    }, []);


retunr (
    <div style={{ position: "relative" }}>
    <button onClick={() => navigate("/chats")}>
        Личные сообщения
    </button>

    {unreadCount > 0 && (
        <span 
            style={{
                position: "absolute",
                top: -5,
                right: -5,
                background: "red",
                color: "white",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600
            }}
        >
            {unreadCount}
        </span>
    )}
</div>

)



}

export default PrivateChatDialogs;