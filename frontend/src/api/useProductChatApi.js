// hooks/useProductChatApi.js
import api from "./axios";
import { useProductStore } from "../components/store/useProductStore";
import { useAppStore } from "../components/store/appStore";


export function useProductChatApi() {
  const {
    limit,
    offset,
    setMessages,
    appendMessages,
    setProduct
  } = useProductStore();

  const fetchProduct = async () => {
    if (!productId) return;
    const res = await api.get(`/products/${productId}`);
    setProduct(res.data);
  };
  
  const user = useAppStore((s) => s.user);
  // Получение сообщений диалога
  const fetchMessages = async ({ user, receiverId, productId, reset = false }) => {
    // if (!user || !receiverId || !productId) return;

    try {
      const res = await api.get(
        `/messages/dialog/${4}/${receiverId}/${productId}/?limit=${limit}&offset=${
          reset ? 0 : offset
        }`
      );

      if (reset) {
        setMessages(res.data.messages || []);
      } else {
        appendMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error("Ошибка при загрузке сообщений:", err);
    }
  };


  return { fetchProduct, fetchMessages };
}
