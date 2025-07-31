import styles from './BottomNavbar.module.css'
import icon from '../../assets/images/LetterS.png'
import favorite from '../../assets/images/favorite.png'
import iconsearch from '../../assets/icons/search.svg'

const BottomNavbar = () =>{
    return(
        <div className={styles['bottom-bar']}>
            <div className={styles['bottom-bar__container']}>
                <div className={styles['item-bar']}>
                    <div className={styles['item-bar__content']}>
                        <div className={styles['item-bar__image']}>
                            <img src={iconsearch} alt="not logo" />
                        </div>
                        <div className={styles['item-bar__title']}>Поиск</div>
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
                                <img src={icon} alt="not logo" />
                            </div>
                            <div className={styles['item-bar__title']}>Профиль</div>
                        </div>
                    </div>

                </div>
               
                
            </div>
        </div>
    )       

}

export default BottomNavbar;