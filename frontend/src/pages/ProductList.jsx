import React, {useState, useEffect} from 'react'
import api from '../api/axios'

const ProductList = () => {
    const [products, setProducts] = useState([])

    useEffect( () => {
        fetchProducts()
        
    },[])

    const fetchProducts = async ()  => {
       try{
            const response = await api.get('productuser/')
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
                        <h3>{product.productName}</h3>
                        <p>{product.price}</p>
                        <p>{product.address}</p>
                        <p>{product.productType}</p>
                        <p>{product.storeName}</p>
                        <div><img src={product.image} alt="" width={200} /></div>
                        <hr />
                    </div>
                    
                ))}
        </div>
    )


}
export default ProductList