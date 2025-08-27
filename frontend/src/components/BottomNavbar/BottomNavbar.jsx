import styles from './BottomNavbar.module.css'
import icon from '../../assets/images/LetterS.png'
import favorite from '../../assets/images/favorite.png'
import iconuser from '../../assets/icons/user.png'
import { Link } from 'react-router-dom'

const BottomNavbar = () =>{
    return(
        <div className={styles['bottom-bar']}>
            <div className={styles['bottom-bar__container']}>
                <Link  className={styles['item-bar']} to="products/"  >
                    <div className={styles['item-bar__content']}>
                        <div className={styles['item-bar__image']}>
                            <img src={icon} alt="not logo" />
                        </div>
                        <div >
                            <div className={styles['item-bar__title']} >Главная</div>
                        </div>
                    </div>
                </Link>
                <div className={styles['bottom-bar__right']}>

                    <Link className={styles['item-bar']} to='/bookmarks'>
                        <div className={styles['item-bar__content']}>
                            <div className={styles['item-bar__image']}>
                                <img src={favorite} alt="not logo" />
                            </div>
                            <div className={styles['item-bar__title']}>Избранное</div>
                        </div>
                    </Link>

                    <Link className={styles['item-bar']} to='/messages'>
                        <div className={styles['item-bar__content']}>
                            <div className={styles['item-bar__image']}>
                                <img src={favorite} alt="not logo" />
                            </div>
                            <div className={styles['item-bar__title']}>Сообщения</div>
                        </div>
                    </Link>
                    <Link to="/profile" className={styles['item-bar']}>
                        <div className={styles['item-bar__content']}>
                            <div className={styles['item-bar__image']}>
                                <img src={iconuser} alt="not logo" />
                            </div>
                            <div >
                                <div className={styles['item-bar__title']} 
                                >Профиль</div>
                            </div>
                        </div>
                    </Link>
                </div>            
            </div>
        </div>
    )       

}

export default BottomNavbar;