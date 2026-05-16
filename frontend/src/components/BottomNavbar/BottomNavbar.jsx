import styles from './BottomNavbar.module.css'
import icon from '../../assets/images/LetterS.png'
import chat from '../../assets/icons/Messenger.png'
import favorite from '../../assets/images/favorite.png'
import iconuser from '../../assets/icons/user.png'
import iconmessages from '../../assets/icons/user.png'
import { Link, replace, useNavigate } from 'react-router-dom'
import UnreadMessage from '../../pages/Message/UnreadMessage'
import { useEffect, useState } from 'react'
import { useProductFilter } from '../store/useProductFilter'
import useStore from '../store/store'
import { useAppStore } from '../store/appStore'





import { useLocation } from 'react-router-dom';
// ... остальные импорты

const BottomNavbar = () => {
    const location = useLocation(); // 📍 Следим за текущим URL
    const [isMobile, setIsMobile] = useState(false);
    
    const user = useStore((s) => s.user);
    const fetchTotalUnread = useProductFilter(s => s.fetchTotalUnread);
    
    const navbarMode = useAppStore(s => s.navbarMode);
    const setNavbarMode = useAppStore(s => s.setNavbarMode);

    useEffect(() => {
    if (
        location.pathname === '/message-page' ||
        location.pathname === '/messages' ||
        location.pathname.startsWith('/chat')
    ) {
        // 🔥 мы в чатах / сообщениях
        setNavbarMode('messages');
    } else {
        // 🔥 везде в остальных местах
        setNavbarMode('default');
    }
}, [location.pathname, setNavbarMode]);





    // 2. Обработка ресайза
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 500);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 3. Загрузка непрочитанных
    useEffect(() => {
        if (user) fetchTotalUnread();
    }, [user, fetchTotalUnread]);

    return (
        <div className={styles['bottom-bar']}>
            <div className={styles['bottom-bar__container']}>
                
                {/* 🏠 Главная — видна всегда */}
                <Link className={styles['item-bar']} to="/products">
                    <div className={styles['item-bar__content']}>
                        <div className={styles['item-bar__image']}>
                            <img src={icon} alt="home" />
                        </div>
                        <div>
                            {isMobile 
                                ? <div className={styles['item-bar__title-mobile']}>Главная</div> 
                                : <div className={styles['item-bar__title-full']}>StoreChat</div>
                            }
                        </div>
                    </div>
                </Link>

                {/* 💬 Message (чат) — виден всегда */}
                <Link className={styles['item-bar']} to="/message-page">
                    <div className={styles['item-bar__content']}>
                        <div className={styles['item-bar__image']}>
                            <img src={chat} alt="chat" />
                        </div>
                        <div>
                            {isMobile 
                                ? <div className={styles['item-bar__title-mobile']}>Message</div> 
                                : <div className={styles['item-bar__title-full']}>StoreChat</div>
                            }
                        </div>
                    </div>
                </Link>

                <div className={styles['bottom-bar__right']}>
                    {/* ⭐ Избранное */}
                    <Link className={styles['item-bar']} to='/bookmarks'>
                        <div className={styles['item-bar__content']}>
                            <div className={styles['item-bar__image']}>
                                <img src={favorite} alt="fav" />
                            </div>
                            <div className={styles['item-bar__title']}>Избранное</div>
                        </div>
                    </Link>
                    
                    {/* 📩 Пункт "Сообщения" — скрывается, если navbarMode === 'messages' */}
                    {navbarMode === 'default' && (
                        <Link className={styles['item-bar__messages']} to='/messages'>
                            <UnreadMessage/>
                        </Link>
                    )}

                    {/* 👤 Профиль */}
                    <Link to="/profile" className={styles['item-bar']}>
                        <div className={styles['item-bar__content']}>
                            <div className={styles['item-bar__image']}>
                                <img src={iconuser} alt="user" />
                            </div>
                            <div className={styles['item-bar__title']}>Профиль</div>
                        </div>
                    </Link>
                </div>            
            </div>
        </div>
    );
};

export default BottomNavbar;