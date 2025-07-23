import React, {useState, useEffect} from 'react'
import api from '../api/axios'

const ProductList = () => {
    const [products, setProducts] = useState([])
    const [activeFilter, setActiveFilter] = useState('all')

   

    const fetchProducts = async (filter)  => {
        console.log('filter', filter)
       try{
            let url = 'http://127.0.0.1:8000/api/products/'
            if (filter === 'owner')
                url += '?type=owner'
            else
                if (filter === 'user')
                    url += '?type=user'
            
            const response = await api.get(url)
            console.log('url', url)
            setProducts(response.data)
           
        }
       catch(error) {
            console.error(error)
       }
    }

    useEffect( () => {
        fetchProducts(activeFilter)
        
    },[activeFilter])

  const buttonStyle =(isActive) => ({
        padding:'10px 20px',
        backgroundColor:isActive ? '#fCAF50':'#e0e0e0',
        color:isActive ? 'white' : 'black',
        border: 'none',
        borderRadius:'pointer',
        gap:'20px'
    })

    return (
        <div>
            <div style={{display:'flex', justifyContent:'center', gap:'10px', marginBottom:'20px'}}>
                <button onClick={() => setActiveFilter('all')}  style={buttonStyle('all')}  >Все </button>
                <button onClick={() => setActiveFilter('owner')} style={buttonStyle('owner')} >Владельцы</button>
                <button onClick={() => setActiveFilter('user')}  style={buttonStyle('user')} >Люди</button>
            </div>
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