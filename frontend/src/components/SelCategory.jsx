import { useState, useEffect } from "react";
import api from "../api/axios";
import styles from './SelCategory.module.css'


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
             <select className={styles['categ-add__category']} name="category" onChange={handleChangeCategories}>
                
                <option value=""> категории</option>
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