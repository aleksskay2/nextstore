import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'
import EditUserProduct from '../components/EditUserProduct';

const ProductList = () => {
    const [products, setProducts] = useState([])
    const [activeFilter, setActiveFilter] = useState('all')
    const [editId, setEditId] = useState(null)
   

    const fetchProducts = async (filter)  => {
     
       try{
            let url = 'http://127.0.0.1:8000/api/products/'
            if (filter === 'owner')
                url += '?type=owner'
            else
                if (filter === 'user')
                    url += '?type=user'
            
            const response = await api.get(url)
         
            setProducts(response.data)
           
        }
       catch(error) {
            console.error(error)
       }
    }

    useEffect( () => {
        fetchProducts(activeFilter)
        
    },[activeFilter])

    // Для удаления данных с productUser = 'user'
    const handleDelete = async (id) => {
        try {
            await api.delete(`delete-user-product/${id}`)
            setProducts(products.filter(prod => prod.id != id))
        }
        catch (error){
            console.error('error', error)
        }
    }

    const handleEdit = (id) =>{
        setEditId(id)
    }




    const buttonStyle =(isActive) => ({
        padding:'10px 20px',
        backgroundColor:isActive ? '#fCAF50':'#e0e0e0',
        color:isActive ? 'white' : 'black',
        border: 'none',
        borderRadius:'pointer',
        gap:'20px'
    })


    const navigate = useNavigate()


    return (
        <div>
            <div style={{display:'flex', justifyContent:'center', gap:'10px', marginBottom:'20px'}}>
                <button onClick={() => setActiveFilter('all')}  style={buttonStyle('all')}  >Все </button>
                <button onClick={() => setActiveFilter('owner')} style={buttonStyle('owner')} >Владельцы</button>
                <button onClick={() => setActiveFilter('user')}  style={buttonStyle('user')} >Люди</button>
            </div>
            <h2>Товары</h2>
            
            {products.map(product => (
                    <div key={product.id}>
                        <h3>{product.productName}</h3>
                        <p>{product.price}</p>
                        <p>{product.address}</p>
                        <p>{product.productUser}</p>
                        <p>{product.storeName}</p>
                        
                           {  (product.image == "http://127.0.0.1:8000/media/media") ?
                        ( <div>Нет фото</div>)
                        :(<div><img src={product.image} alt="" width={150}/></div>)
                    }
                        { product.productUser === 'user' && (
                            <>
                                <button onClick={() => handleDelete(product.id)}>
                                        Удалить
                                    </button>
                                         
                                        
                                <button onClick={() =>navigate(`/edit-user-product/${product.id}`)}>
                                        Ред
                                    </button> 
                  
                            
                            </>
                               
                            ) }
                          
                        <hr />
                    </div>
                    
                ))}
        </div>
    )

  

}
export default ProductList