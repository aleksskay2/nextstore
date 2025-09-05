import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const ChatList = ({ currentUserId }) => {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await api.get(`messages/dialogs/`);
        setChats(res.data);
      } catch (err) {
        console.error("Ошибка при загрузке чатов", err);
      }
    };

    fetchChats();
  }, [currentUserId]);

  return (
    <div className="space-y-3">
      {chats.map((chat) => (
        <div
          key={`${chat.product_id}-${chat.sender_id}-${chat.receiver_id}`}
          className="flex items-center justify-between p-3 rounded-2xl shadow hover:bg-gray-100 cursor-pointer"
          onClick={() =>
            navigate(`/chat/${chat.product_id}`, {
              state: { sender: chat.sender_id },
            })
          }
        >
          {/* Левая часть: аватар + текст */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              💬
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">
                Чат по товару #{chat.product_id}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[180px]">
                {chat.last_message}
              </p>
            </div>
          </div>

          {/* Правая часть: дата + бейдж */}
          <div className="flex flex-col items-end">
            <p className="text-xs text-gray-400">
              {new Date(chat.last_message_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {chat.unread_count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                {chat.unread_count}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;