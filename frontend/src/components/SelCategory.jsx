import { useState, useEffect } from "react";
import api from "../api/axios";


const SelCategory = ({ onResults}) => {
    const [categories, setCategories] = useState([])
    
     useEffect(() => {
        fetchCategories()
    }, [])


      const fetchCategories = async () => {
       try{
            const responseCategories = await api.get('categories/')
            setCategories(responseCategories.data)
            
        }
       catch(error) {
            console.error(error)
       }
    }


    const handleChangeCategories = async (e) => {
          try {
            const response = await api(`products/?category=${e.target.value}&ordering=price`, {
                
            }
            )      
            console.log('e.CatProd = ' , e.target.value)
            onResults(response.data)

        }

        catch(error) {
            console.error('error in SearchAndSort', error)
        }
    }

    return (
        <div>
             <select name="category" onChange={handleChangeCategories}>
                
                <option value="">Выбери категории</option>
                {
                  
                    categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.CategoryName}</option>
                    ))
                }
            </select>
        </div>
    )

}

export default SelCategory;