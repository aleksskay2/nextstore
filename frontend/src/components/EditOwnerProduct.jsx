import { useState, useEffect } from "react";
import axios from 'axios'
import api from '../api/axios'
import { useParams } from "react-router-dom";


// Форма изменения товара владельцев

const EditOwnerProduct = () => {
    const {id} = useParams();
    const [formData, setFormData] = useState({
        storeName:'',
        productName:'',
        price:'',
        address:'',
        region:'',
        weight:"", 
        category: '', 
       
        image:null,
        dateUpdate:''
    })

    const [image, setImage] = useState(null)
    const [previewImage, setPreviewImage] = useState(null)
    const [categories, setCategories] = useState([])
    const [regions, setRegions] = useState([])
    const [errors, setErrors] = useState({})

    useEffect(() => {

        const token = localStorage.getItem('access')
        if (!token) {
            alert('Вы не вошли в аккаунт!')
            return;
        }
        // получение продукта по id для изменения
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('access')
                const response = await api.get(`my-products/${id}/`,{
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                }


                )
                setFormData(response.data)
                console.log('resDataEditOnwer', response.data)
                setPreviewImage(response.data.image)
                {console.log('resImage',response.data.image)}
            }
            catch(error){
                console.error('Ошибка при загрузке товара', error)
            }
        }

         // получение категорий и регионов 
        const fetchCategAndRegions = async () => {
            try {
                const responseCategories = await api.get('categories/')
                const responseRegions = await api.get('regions/')
                setCategories(responseCategories.data)
                setRegions(responseRegions.data)
                {console.log('responeReg', responseRegions)}
            }
            catch(error){
                console.error('Ошибка при загрузке категорий и регионов')
            }
        }
         fetchProducts();
        fetchCategAndRegions();},
    [id])


    const handleChange = e => {
        setFormData({...formData, [e.target.name]: e.target.value})
        setErrors({...errors, [e.target.name]: ''})
    }


    const handleImageChange = e => {
        const file = e.target.files[0]
        setImage(file)
        setPreviewImage(URL.createObjectURL(file))
    }

    // Проверка обязательных полей
    const validationFrom = () => {
       

        const newErrors = {}
        if (!formData.storeName.trim())  newErrors.storeName = 'поле "Название магазина обязательно" '; 
        if (!formData.productName.trim())  newErrors.productName = 'поле "Название магазина обязательно" '; 
        if (!formData.address.trim())   newErrors.address = 'поле "Название магазина обязательно" '; 
        if (!formData.region)  newErrors.region = 'поле "Название магазина обязательно" '; 
        if (!formData.category)  newErrors.category = 'поле "Название магазина обязательно" '; 
        if (!formData.price.trim() && formData.price <= 0) 
             newErrors.price = 'Цена не заполнено или меньше либо равно 0!" '; 
        
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0;
    }




     const handleSubmit = async e => {
        e.preventDefault()
         
        // если есть обязательные поля,  то выход из функции 
        if (!validationFrom()) {
            alert('Заполните обязательные поля!')
            return;
        }
        
        const data = new FormData()
    
        for(const key in formData)
        {
            if (formData[key] !== null && formData[key] !== undefined)
            data.append(key, formData[key])
        }
           

        if (image) {
            data.append('image', image)
        }
        

        

        try {
            
            const token = localStorage.getItem('access')
            const response =  await api.patch(`my-products/${id}/`,data, {
                headers:{
                    Authorization :`Bearer ${token}`,
                     'Content-Type': 'multipart/form-data',
                }
            })
            console.log('data', data)
            alert('Товар добавлен')
        } catch(error) {
            console.error('Ошибка при добавлении товара:', error.response?.date || error);
            alert('Ошибка при добавлении товара')
        }

    }


    return (
        <form onSubmit={handleSubmit}>
            
            <input type="text" name="storeName" value={formData.storeName}
             placeholder="Название магазина" onChange={handleChange} />
            <br /><br />
           
            <input type="text" name="productName" value={formData.productName}
            placeholder="Товар" onChange={handleChange} />
             <br /><br />
            
            <input type="text" name="price" placeholder="Цена"  value={formData.price}
             onChange={handleChange} />
            {errors && <p style={{color:'red'}}>{errors.price}</p>}
            <br /><br />

            <input type="text" name="address" placeholder="Адрес" value={formData.address}
            onChange={handleChange} />
          <br /><br />

            <input type="date" name="dateUpdate" value={formData.dateUpdate} 
             readOnly onChange={handleChange} />
        <br /><br />

            <select name="region" value={formData.region} onChange={handleChange}>
                <option value="">Выбери регион</option>
               
                {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.nameRegions}</option>
                ))}
            </select>
            <br /><br />
            <select name="category" value={formData.category} onChange={handleChange}>
                
                <option value="">Выбери категории</option>
                {
                  
                    categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.CategoryName}</option>
                    ))
                }
            </select>
            <br /><br />
          
            <br />
            <br />

            {previewImage && (
                <div>
                    <p>Текущее изображение</p>
                    <img src={previewImage} alt=""  width={200}
                     />
                </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} />
             <br /><br />

            <button type="submit">Сохранить</button>
            
        </form>
    )
}

    
export default EditOwnerProduct