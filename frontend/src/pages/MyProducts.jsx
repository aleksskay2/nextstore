import { useEffect, useState } from "react";
import api from '../api/axios'


const MyProducts = () => {
    const [products, setProducts] = useState([])

    useEffect(() => {
        fetchProducts()
    },[])

    const fetchProducts = async () =>  {
        try {
            const token = localStorage.getItem('access')
            const response = await api.get('my-products/', {
                headers:{
                    Authorization :`Bearer ${token}`
                }
            })

            setProducts(response.data)
        }
        catch(error) {
            console.error('error', error)
        }
    }



    return (
        <>
            {console.log('products' , products)}
            {!products.length ? (
                <div> У вас пока нет товаров</div>
            ):(
                <ul>
                    {products.map(prod => (
                        <li key={products.id}>
                            <p>{prod.storeName}</p>
                            <p>{prod.productName}</p>
                            <p>product.price</p>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )

}

export default MyProducts;