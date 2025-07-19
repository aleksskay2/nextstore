import { useState, useEffect } from "react";
import axios from 'axios'
import api from '../api/axios'


// Форма добавления товара

const AddProductUser = () => {
    const [formData, setFormData] = useState({
        storeUserName:'',
        priceUser:'',
        productNameUser:'',
        addressUserStore:'',
        regionUser:'',
        fk_Category:'',
    })

    const [image, setImage] = useState(null)
    const [categories, setCategories] = useState([])
    const [regions, setRegions] = useState([])
    const [dateUpdate, setDateUpdate] = useState('')

    // получаем категории и регионы
     useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        setFormData(prev => ({...prev, dateUpdateUser:today}))
        setDateUpdate(today)
        console.log("today", today)
        fetchCategories()
     }, [])

      const fetchCategories = async ()  => {
       try{
            const responseCategories = await api.get('categories/')
            // console.log('res.data', responseCategories.data)
            setCategories(responseCategories.data)
            const responseRegions = await api.get('regions/')
            // {console.log(responseRegions)}
            setRegions(responseRegions.data)
            
        }
       catch(error) {
            console.error(error)
       }
    }



    const handleChange = e => {
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const handleImageChange = e => {
        setImage(e.target.files[0])
    }

    const handleSubmit = async e => {
        e.preventDefault()
        
        const data = new FormData()
        for(const key in formData)
            data.append(key, formData[key])

        if (image) {
            data.append('imageUserStore', image)
        }

        try {
            const link = api.get('users/');
            const response = await axios.post('http://127.0.0.1:8000/api/users/', data, {
                headers:{
                    'Content-Type':'multipart/form-data',
                },
            })
            alert('Товар добавлен')
        } catch(error) {
            console.error(error)
            alert('Ошибка при добавлении товара')
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="storeUserName" placeholder="Название магазина" onChange={handleChange} />
            <br /><br />
            <input type="text" name="productNameUser" placeholder="Товар" onChange={handleChange} />
             <br /><br />
            <input type="text" name="priceUser" placeholder="Цена" onChange={handleChange} />
            <br /><br />
            <input type="text" name="addressUserStore" placeholder="Адрес" onChange={handleChange} />
          <br /><br />
            <input type="date" name="dateUpdateUser" value={dateUpdate}  readOnly onChange={handleChange} />
        <br /><br />
            <select name="regionUser" onChange={handleChange}>
                <option value="">Выбери регион</option>
                {/* {console.log('regions', regions)} */}
                {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.nameRegions}</option>
                ))}
            </select>
            <br /><br />
            <select name="fk_Category" onChange={handleChange}>
                
                <option value="">Выбери категории</option>
                {
                  
                    categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.CategoryName}</option>
                    ))
                }
            </select>
            <br /><br />
            <input type="file" accept="image/" onChange={handleImageChange} />
           <br /><br />
            <button type="submit">Добавить товар</button>
            
        </form>

    )
}

export default AddProductUser;