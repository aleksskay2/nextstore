import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";


const SellerProductPage =  () => {
    let id = useParams()
    id = id.id
    const [products, setProducts] = useState([])


    useEffect(() => {
        const getProductsByUser = async () => {
            try {
                console.log('id - ', id)
                const response = await api.get(`/owner-products/by-user/${id}`)
                setProducts(response.data)
            }
            catch(error) {
                console.error('Ошибка получения всех товаров владельца', error)
            }
            
            
        } 
        getProductsByUser()
    }, [])

    return (
        <div className="product">
            <h2>Все товары</h2>
            {
                products.length === 0 ? (
                    <h2>У продавца нет товара</h2>
                ):(
                    <ol>
                    {products.map(prod => (
                        <li key={prod.id}>
                            <div>{prod.storeName}</div>
                            
                            <div>{prod.productName}</div>
                            <div>{prod.price}</div>
                            
                               
                            <div>
                                 <img src={prod.main_image} width={80} ></img>
                            </div>

                        </li>
                    ))}
                </ol>
                )
            } 
        </div>
    )
}

export default SellerProductPage;