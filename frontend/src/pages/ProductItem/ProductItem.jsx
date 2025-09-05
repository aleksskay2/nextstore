import {Link, useNavigate} from 'react-router-dom'
import {FaHeart, FaRegHeart} from 'react-icons/fa'
import styles from '../ProductItem/ProductItem.module.css'
import delIcon from '../../assets/images/deletePng.png' 
import { useState } from 'react'
import api from '../../api/axios'




const ProductItem = ({ deleteProd, product, onBookmarkChange}) => {
    const [isBookmark, setIsBookmark] = useState(product.is_bookmark)
    const [messageText, setMessageText] = useState('');
    


    const toggleBookmark = async (productId, isBookmark) => {
        const newState = !isBookmark

        setIsBookmark(newState)
       
        try {
            const token  = localStorage.getItem('access')
              if (!token) {
              
                alert('Только авторизованные пользователи могут доваблять в избранное');
                return;
            }
            
            if (isBookmark) {
               await api.delete(`bookmarks/remove${productId}/`)
               console.log('work delete')
            }
            else {
                await api.post('bookmarks/add/', {product:productId})
            }
            onBookmarkChange(product.id, newState)
            
        }
        catch (error) {
            console.error('Ошибка при изменении избранного:', error)
        }    
    }

   
    const navigate = useNavigate()

    

    

    return (
        <>
             <div className={styles['product__item']}>
                
                            {/* {
                                (!(products.length)) && (
                                    <div className={styles['product__count']}>
                                        Нет товара
                                    </div>
                                )
                            } */}
                            { (product.productUser === 'user' ) && (
                                    <div className={styles['item-product__btns']}>
                                        <button  className={styles['item-product__edit']} 
                                        onClick={() =>navigate(`/edit-user-product/${product.id}`)}>
                                       ...   
                                        </button>     
                                        <button  className={styles['item-product__delete']} 
                                        onClick={() => deleteProd(product.id)}>
                                            <img src={delIcon} alt="" />
                                        </button>
                                    </div>
                                                                              
                                    ) }   
                          
                            <Link  to={`/products/${product.id}`} className={styles['item-product']} key={product.id}>
                                  
                                    <div className={styles['item-product__content']}>
                                        <div className={styles['item-product__img-price']} >
                                                
                                        
                                        
                                            { (product.main_image) ? (<div className={styles['item-product__image']} >
                                                
                                                    <img src={product.main_image} alt="" /></div>):
                                                ( <div>Нет фото</div>) 
                                            
                                            } 
                                                
                                            <div className={styles['item-product__price']} >
                                                { Math.round( product.price)} &#8381; 
                                            </div>
                                    
                                

                                        </div>
                             
                                <div className={styles['item-product__info']}>
                                   
                                    
                                     <div className={styles['item-product__product-name']}>
                                        {product.productName}
                                    </div > 
                                     <div className={styles['item-product__weight']}>
                                        {product.weight}
                                    </div >
                                    
                                   
                                    <div className={styles['']}>
                                        {product.productUser}
                                    </div>
                                    <div className={styles['item-product__title']}>
                                        Имя магазина:
                                    </div>
                                    <div className={styles['item-product__store-name']} >
                                        {product.storeName}
                                    </div>



                                    <div onClick={(e) => {
                                    e.preventDefault();
                                    toggleBookmark(product.id, product.is_bookmark)
                                }} className={styles['item-product__bookmark']} >
                                    {product.is_bookmark ? <FaHeart color="red"/> :<FaRegHeart color="black"/> }
                                </div>

                                
                                    <div  className={styles['item-product__region']}>
                                        {product.region}
                                    </div>
                                
                             

                                </div>
                                 
                            </div>
                              
                             
                            <div className={styles['item-product__address']}>
                                        {product.address} 
                            </div>    




                       
                   
                        </Link> 
                            
                    </div>
        </>
    )
    
        
} 

export default ProductItem;