import React, {useState, useEffect} from 'react'
import api from '../api/axios'

const ProductList = () => {
    const [products, setProducts] = useState([])

    useEffect( () => {
        fetchProducts()
        
    },[])

    const fetchProducts = async ()  => {
       try{
            const response = await api.get('store-admins/')
            setProducts(response.data)
           
        }
       catch(error) {
            console.error(error)
       }
    }



    return (
        <div>
            <h2>Товары</h2>
            {console.log(products)}
            {products.map(product => (
                    <div key={product.id}>
                        <h3>{product.nameProductAdmin}</h3>
                        <p>{product.priceAdmin}</p>
                        <p>{product.addressProductAdmin}</p>
                    </div>
                ))}
        </div>
    )


}
export default ProductList