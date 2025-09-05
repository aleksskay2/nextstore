import { useState, useEffect } from "react";
import api from '../../api/axios'
import { useParams } from "react-router-dom";
import { FaCamera } from "react-icons/fa";


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
    const [preview, setPreview] = useState(null)
    const [previews, setPreviews] = useState([])
    const [categories, setCategories] = useState([])
    const [regions, setRegions] = useState([])
    

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get(`edit-user-products/${id}/`)
                setFormData(response.data)
                setPreview(response.data.main_image)
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
        setPreviews(previews)
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
            console.log('main_image - ', main_image)
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
        if (e.target.files && e.target.files[0])
        {
            setMain_image(e.target.files[0])
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file)
            setPreview(imageUrl)
        }
          
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
          
            
            <h3>Главное</h3>
                       <div>
                        { console.log('preview - ' , preview)} 
                       {
                           
                           (preview) && (
                               <img 
                                   src={preview} 
                                   alt="" 
                                   width={40}
                                   />
                           )
                       }
           
                       <input  
                           id='fileMainInput'
                           type="file"  
                           accept="image/*" 
                           style={{visibility:'hidden',
                               display:'flex',
                               flexDirection:'column',
                               alignItems:'center'
                           }}
                           onChange={handleMainImage} />
           
                           <label  style={{backgroundColor:'lightblue', 
                               padding:'2px',
                               display:'flex',
                               flexDirection:'column',
                               alignItems:'center'
                           
                           }} htmlFor="fileMainInput">
                               <FaCamera size={20}/>
                              
                               
                               <span>Главное фото</span>
                       </label>
                       </div>
                       
                       {
                           previews.map(item => (
                                (item) && (
                               <img 
                                   src={item.preview} 
                                   alt="" 
                                   width={50}
                                   />
                           )
                           ))
                          
                       }
                       
                        <input  multiple
                           id='fileInput'
                           type="file"  
                           accept="image/*" 
                           style={{visibility:'hidden',
                               display:'flex',
                               flexDirection:'column',
                               alignItems:'center'
                           }}
                           onChange={handleImageChange} />
           
                           <label  style={{backgroundColor:'lightblue', 
                               padding:'2px',
                               display:'flex',
                               flexDirection:'column',
                               alignItems:'center'
                           
                           }} htmlFor="fileInput">
                               <FaCamera size={20}/>                 
                               
                               <span>Дополнительные фото</span>
                       </label>
           
                     
             <br />

            <button type="submit">Сохранить</button>
            
        </form>
    )
}

    
export default EditUserProduct