import { useEffect, useState } from "react";
import api from '../../api/axios';
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import backArrow from '../../assets/icons/arrow_back.svg'

const ProductDetail = () => {
    const {id} = useParams();
    const [product, setProduct] = useState(null);
    const navigate =  useNavigate();

    useEffect(()=> {
        const fetchProduct = async () =>{
            try {
                const response = await api.get(`products/${id}/`);
                setProduct(response.data);
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

    return (
        <>
            <div className="back-buttons">
                <div className="back-buttons__btn">
                    <button onClick={handleGoBack} >
                        <img  src={backArrow} width={50} alt="" />
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
                            <img src={product.image} width={200} alt="нет изображения" />
                        </div>
                        <div className="detail__price">
                            {product.price}
                        </div>
                        <div className="detail__name">
                            {product.productName}
                        </div>
                    </div>

                    <div className="detail__desc product-desc">
                        <div className="product-desc__text">
                            {product.description}
                        </div>
                        <div className="desc__address">
                            {product.address}
                        </div>
                        <div className="desc__store-name">
                            {product.storeName}
                        </div>

                    </div>
        
                            
                </div>
            </div>
         </>
    )


}

export default ProductDetail;

