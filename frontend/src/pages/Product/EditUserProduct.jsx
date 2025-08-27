import { useState, useEffect } from "react";
import api from '../../api/axios'
import { useParams } from "react-router-dom";


// Форма добавления товара

const EditUserProduct = () => {
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
    })

    const [main_image, setMain_image] = useState(null)
    const [images, setImages] = useState([])
    const [previewImage, setPreviewImage] = useState(null)
    const [categories, setCategories] = useState([])
    const [regions, setRegions] = useState([])
    

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get(`edit-user-products/${id}/`)
                setFormData(response.data)
                setPreviewImage(response.data.main_image)
                {console.log('resImage',response.data.main_image)}
            }
            catch(error){
                console.error('Ошибка при загрузке товара', error)
            }
        }

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
         fetchProducts(),
        fetchCategAndRegions()},
    [id])


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

        setImages((prev) => [...prev, ...previews]);
    }

     const handleSubmit = async e => {
        e.preventDefault()
          {console.log('formData', formData)}
        
        const data = new FormData()
    
        for(const key in formData)
        {
            if (key!== 'user' && key !== 'owner')
            data.append(key, formData[key])
        }
        
        if (main_image)
        {
            data.append('main_image', main_image)
        }
           

          if (images) {
            Array.from(images).forEach((file) => {
                data.append('product_images', file.file)
            })
            
        }

        const token = localStorage.getItem('access');
        const isAuthenticated = !! token;

        const endPoint =
        `edit-user-products/${id}/`
        

        try {
                console.log('data')
                for (let pair of data.entries()) {
                console.log(pair[0], pair[1]);
}
            const response = await api.patch(endPoint, data, {
                headers:{
                    'Content-Type':'multipart/form-data'
                    
                },
            })
            alert('Товар добавлен')
        } catch(error) {
            console.error('Ошибка при добавлении товара:', error.response?.date || error);
            alert('Ошибка при добавлении товара')
        }

    }

     const handleMainImage = (e) => {
        const file = e.target.files[0]
        if (file)
            setMain_image(file)
          
    }

    return (
        <form onSubmit={handleSubmit}>
             {
                console.log('id', id)
             }
            <input type="text" name="storeName" value={formData.storeName}
             placeholder="Название магазина" onChange={handleChange} />
            <br /><br />
           
            <input type="text" name="productName" value={formData.productName}
            placeholder="Товар" onChange={handleChange} />
             <br /><br />
            
            <input type="text" name="price" placeholder="Цена"  value={formData.price}
             onChange={handleChange} />
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
          
            
            {previewImage && (
                <div>
                    <p>Текущее изображение</p>
                    <img src={previewImage} alt=""  width={30} 
                     />
                </div>
            )}

            <h2>Главное </h2>
            <input type="file" multiple accept="image/*" onChange={handleMainImage} />

            <input  multiple type="file" accept="image/*" onChange={handleImageChange} />
             <br /><br />

            <button type="submit">Сохранить</button>
            
        </form>
    )
}

    
export default EditUserProduct