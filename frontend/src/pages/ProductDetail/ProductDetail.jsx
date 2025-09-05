import { useEffect, useState } from "react";
import api from '../../api/axios';
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import backArrow from '../../assets/icons/arrow_back.svg'

import ProductReviews from "../../components/ProductReviews";
import ProductGallery from "../../components/ProductGallery/ProductGallery";

import useStore from "../../components/store/store"; 


const ProductDetail = () => {
    const {id} = useParams();
    const [product, setProduct] = useState(null);
    const navigate =  useNavigate();
    const {messageFirst, setMessageFirst} = useStore()
    
    useEffect(()=> {
        const fetchProduct = async () =>{
            try {
                const response = await api.get(`products/${id}/`);
                setProduct(response.data);
                console.log('res - det - ',response.data)
            }
            catch(error) {
                console.error('Ошибка при загрузке деталей товара:', error);
            }
        }
        fetchProduct();
    },[id])

    if(!product) return <p>Загрузка...</p>

    
  
   

    const handleGoBack = () => {
        if (window.history.length>2)
        navigate(-1)
        else {
            navigate('/')
        }
    }

     

    
    const pageMessage = () => {
        navigate(`/messages/${product.id}`)
        setMessageFirst(true)
        
    }




    return (
        <>
            <div className="back-buttons">
                <div className="back-buttons__btn">
                    <button onClick={handleGoBack} >
                        <img  src={backArrow} width={20} alt="" />
                    </button>
                </div>
            </div>
            <div className="detail">
                <div className="detail__container">
                    <div className="detail__title">
                        <h2>{product.Name}</h2>
                    </div>
                    <div className="detail__image-price-name">
                        <div className="detail__image">
                           { (product.images.length !== 0) ?  (
                                 <ProductGallery images={product.images}/>
                               
                            ) :(
                                <img src={product.main_image} alt="" width={100}/> 
                            )
                            }
                           
                        </div>
                        <div className="detail__price">
                            {product.price}
                        </div>
                        <div className="detail__name">
                            
                            {product.productName}
                        </div>
                    </div>

                    { <div className="detail__desc product-desc">
                        <div className="product-desc__text">
                            {(product.description !== 'null') && (
                                product.description
                            )}
                        </div>
                        <div className="desc__address">
                            {product.address}
                        </div>
                        <div className="desc__store-name">
                            {product.storeName}
                        </div>
                        <div className="desc__store-name">
                            продавец :
                            {
                                (product.owner_info !== null) ? (

                                    <div> 
                                        <div>{product.owner_info.username}</div>
                                        <div className="desc__store-phone">
                                            Номер продавца <br />
                                            {
                                                (product.owner_info !== null) ? (
                                                        <div>
                                                            <button onClick = {() => window.location.href=`tel:${product.owner_info.phone}`}>
                                                                Позвонить
                                                            </button>

                                                            
                                                            
                                                            </div>
                                                ):(<div>Нет номера продавца</div>)
                                            }
                                        </div>
                                                
                                    </div>

                                    
                                ):(
                                      <div>Нет имени продавца</div>
                                )
                               
                            }
                            
                        </div>
                        

                    </div> }

                      <button
                            style={{ display:'block', backgroundColor:'lightblue', width:'300px' }}
                            onClick={() => navigate(`/chat/${product.id}`)}
                            >
                            Написать продавцу
                            </button>
                        {/* { <Message product={product} /> } */}
                        <ProductReviews  productId={product.id}/>


              
                            
                </div>
            </div>
         </>
    )


}

export default ProductDetail;

