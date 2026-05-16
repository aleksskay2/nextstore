


import { useEffect, useState,  useRef } from "react";

import { useParams, useLocation } from "react-router-dom";
import api from "../../api/axios";
import styles from "./ChatPage.module.css";
import { jwtDecode } from "jwt-decode";
import useStore from "../../components/store/store";
import MessageStatus from "./MessageStatus";
import ImageGallery from "./ImageGallery";
import DoubleClickImage from "./DoubleClickImage";
import clip from "../../assets/icons/clip.png";
import messageIcon from "../../assets/icons/arrow_message.png";
import { cn } from "../../utils/cn";
import { useProductFilter } from "../../components/store/UseProductFilter";
import { useAppStore } from "../../components/store/appStore";
import { useProductChatSocket } from "../../hooks/useProductChatSocket";
import { useProductStore } from "../../components/store/useProductStore";
import ChatHeader from './ChatHeader'
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

const ChatPage = () => {
  

  const { productId, companionId } = useParams();
  const user = useAppStore((s) => s.user);
  const userId = user?.id;
  const userName = user?.username;

  const messageRefs = useRef({}); // для скролла и подсветки
  const [product, setProduct] = useState(null);
  const limit = 10;
  const [offset, setOffset] = useState(0);

  // Product store
  const setCurrentUser = useProductStore((s) => s.setCurrentUser);
  const setMessages = useProductStore((s) => s.setMessages);

  // Загружаем продукт
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${productId}`);
        setProduct(res.data);
        console.log("product", res.data);
      } catch (err) {
        console.error("Ошибка получения товара", err);
      }
    };

    fetchProduct();
  }, [productId]);

  // Загружаем сообщения
  useEffect(() => {
    if (!userId || !companionId || !productId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(
          `/messages/dialog/${userId}/${companionId}/${productId}/?limit=${limit}&offset=${offset}`
        );
        setMessages(res.data.messages);
      } catch (err) {
        console.error("Ошибка при загрузке сообщений:", err);
      }
    };

    fetchMessages();
  }, [userId, companionId, productId, offset, setMessages]);

  // Устанавливаем текущего пользователя в стор
  useEffect(() => {
    if (userId) setCurrentUser(userId);
  }, [userId, setCurrentUser]);

  // Подключение к WebSocket
  const canConnect = Boolean(productId && companionId && userId);
  const { socket, connect, disconnect } = useProductChatSocket(
    canConnect ? productId : null,
    canConnect ? userId : null,
    canConnect ? companionId : null,
    messageRefs
  );

  // Автоматическое подключение/отключение WebSocket
  useEffect(() => {
    if (!canConnect) return;
    

    connect();

    return () => {
      disconnect();
    };
  }, [canConnect, connect, disconnect]);



  return (
    <>
    <div className={styles["chat__wrapper"]}  >
      <div className={styles["chat__container"]} >
        <ChatHeader styles={styles} product={product} />
        <MessageList styles={styles} userId={user?.id} />
        <ChatInput styles={styles}   productId={productId}
          companionId={companionId}
          userId={userId}/>

      </div>
    </div >
      
      
    </>
  );
};

export default ChatPage;
