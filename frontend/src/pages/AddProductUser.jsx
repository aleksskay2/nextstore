import { useState, useEffect } from "react";
import axios from 'axios'
import api from '../api/axios'


// Форма добавления товара

const AddProductUser = () => {
    const [formData, setFormData] = useState({
        storeName:'',
        productName:'',
        price:'',
        address:'',
        region:'',
        weight:"", 
        category: '', 
       
        image:null,
    })

    const [images, setImages] = useState([])
    const [main_image, setMain_image] = useState(null)
    const [categories, setCategories] = useState([])
    const [regions, setRegions] = useState([])
    const [dateUpdate, setDateUpdate] = useState('')
    const [errors, setErrors] = useState({})

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
            setCategories(responseCategories.data)
            const responseRegions = await api.get('regions/')
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
        const files = Array.from(e.target.files);

        const previews = files.map((file) => {
            if (file instanceof File) {
            return {
                file,
                preview: URL.createObjectURL(file),
            };
            }
            return null;
        }).filter(Boolean);
        setImages(files)
    }

 // Проверка обязательных полей
    const validationFrom = () => {
        const newErrors = {}
        if (!formData.storeName.trim())  newErrors.storeName = '"Название магазина не заполнено" '; 
        if (!formData.productName.trim())  newErrors.productName = '"Имя товара не заполнено" '; 
        if (!formData.address.trim())   newErrors.address = ' "Адрес магазина не заполнено" '; 
        if (!formData.region)  newErrors.region = 'поле "Имя региона не заполнено" '; 
        if (!formData.category)  newErrors.category = '"Категория  не выбрано" '; 
        if (!formData.price.trim() && formData.price <= 0) 
             newErrors.price = 'Цена не заполнено или меньше либо равно 0!" '; 
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async e => {
        e.preventDefault()

        if (!validationFrom()) {
            alert('Обязательные поля не заполнены!')
            return;
        }
        
        const data = new FormData()
    
        for(const key in formData)
        {
            data.append(key, formData[key])
        }
           
          console.log(images)

        if (main_image)
        {
            data.append('main_image', main_image)
        }
        if (images.length > 0) {
            images.forEach((file) => {
                data.append('product_images', file)
            })
        }

        const token = localStorage.getItem('access');
        const isAuthenticated = token;

        const endPoint = isAuthenticated ?
        'http://127.0.0.1:8000/api/owner-products/'
        :'http://127.0.0.1:8000/api/products/';

        try {
            console.log('endPoint = ', endPoint)
            const token = localStorage.getItem('access')
            console.log('data ', data)    
            await api.post(endPoint, data, {
                headers:{
                    'Content-Type':'multipart/form-data',
                },
            })
           
            alert('Товар добавлен')
        } catch(error) {
            console.error('Ошибка при добавлении товара:', error.response?.date || error);
            alert('Ошибка при добавлении товара')
        }
    }

    const handleMainImage = (e) => {
        if (e.target.files && e.target.files[0])
        {
            setMain_image(e.target.files[0])
        }
          
    }

    
    return (
        <form onSubmit={handleSubmit}>
          
            <input type="text" name="storeName" placeholder="Название магазина" onChange={handleChange} />
            {errors && <p style={{color:'red'}}>{errors.storeName}</p>}
          
            <input type="text" name="productName" placeholder="Товар" onChange={handleChange} />
            {errors && <p style={{color:'red'}}>{errors.productName}</p>}

            
            <input type="number" name="price" placeholder="Цена" onChange={handleChange} />
            {errors && <p style={{color:'red'}}>{errors.price}</p>}

           
            <input type="text" name="address" placeholder="Адрес" onChange={handleChange} />
            {errors && <p style={{color:'red'}}>{errors.address}</p>}

      
            <input type="date" name="dateUpdate" value={dateUpdate}  readOnly onChange={handleChange} />
            <br />
            <br />
            <select name="region" onChange={handleChange}>
                <option value="">Выбери регион</option>
                {/* {console.log('regions', regions)} */}
                {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.nameRegions}</option>
                ))}
            </select>
            {errors && <p style={{color:'red'}}>{errors.region}</p>}
            
            <select name="category" onChange={handleChange}>
                
                <option value="">Выбери категории</option>
                {
                  
                    categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.CategoryName}</option>
                    ))
                }
            </select>
            {errors && <p style={{color:'red'}}>{errors.category}</p>}
         
          
            <br />
            <br />
            <h3>Главное</h3>
            <input type="file"  accept="image/*" onChange={handleMainImage} />

            <input type="file" multiple accept="image/*" onChange={handleImageChange} />
            
            <br /><br />
            <button type="submit">Добавить товар</button>
            
        </form>

    )
}

export default AddProductUser;