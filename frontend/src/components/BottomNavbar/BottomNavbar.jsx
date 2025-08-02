import styles from './BottomNavbar.module.css'
import icon from '../../assets/images/LetterS.png'
import favorite from '../../assets/images/favorite.png'
import iconuser from '../../assets/icons/user.png'
import { Link } from 'react-router-dom'

const BottomNavbar = () =>{
    return(
        <div className={styles['bottom-bar']}>
            <div className={styles['bottom-bar__container']}>
                <div className={styles['item-bar']}>
                    <div className={styles['item-bar__content']}>
                        <div className={styles['item-bar__image']}>
                            <img src={icon} alt="not logo" />
                        </div>
                        <div >
                            <Link className={styles['item-bar__title']} to="products/">Главная</Link>
                        </div>
                    </div>
                </div>
                <div className={styles['bottom-bar__right']}>
                    <div className={styles['item-bar']}>
                        <div className={styles['item-bar__content']}>
                            <div className={styles['item-bar__image']}>
                                <img src={favorite} alt="not logo" />
                            </div>
                            <div className={styles['item-bar__title']}>Избранное</div>
                        </div>
                    </div>
                    <div className={styles['item-bar']}>
                        <div className={styles['item-bar__content']}>
                            <div className={styles['item-bar__image']}>
                                <img src={iconuser} alt="not logo" />
                            </div>
                            <div >
                                <Link className={styles['item-bar__title']} to="/profile"
                                >Профиль</Link>
                            </div>
                        </div>
                    </div>

                </div>
               
                
            </div>
        </div>
    )       

}

export default BottomNavbar;