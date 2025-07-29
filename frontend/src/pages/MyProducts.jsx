import { useEffect, useState } from "react";
import api from '../api/axios'
import { useNavigate } from "react-router-dom";


const MyProducts = () => {
    const [products, setProducts] = useState([])

    useEffect(() => {
        fetchProducts()
    },[])


    const fetchProducts = async () =>  {
        try {
            
            const response = await api.get('my-products/')

            setProducts(response.data)
        }
        catch(error) {
            console.error('error', error)
        }
    }

    // Удаление товара из пункта Мои товары
    const handleDelete = async (id) => {
        try {
          
            const response =  await api.delete(`my-products/${id}`)
            
            setProducts(products.filter(prod => prod.id != id))
        }
        catch (error){
            console.error('error', error)
            if (error.response?.status === 401){
                navigate('/login')
            }
        }
    }

    const navigate = useNavigate();


    return (
        <>
            {console.log('products' , products)}
            {!products.length ? 
            (<div> У вас пока нет товаров</div>):(
                <ol>
                    {products.map(prod => (
                        <li key={prod.id}>
                            <p>{prod.storeName}</p>
                            
                            <p>{prod.productName}</p>
                            <p>{prod.price}</p>
                            <img src={prod.image} width={150} ></img>
                           
                            <button onClick={() => handleDelete(prod.id)}>
                                    Удалить
                                </button>
                            <button onClick={() => navigate(`/edit-product/${prod.id}`)} >
                            Ред</button>
                           
                           
                        </li>
                    ))}
                </ol>
            )}
        </>
    )

}

export default MyProducts;