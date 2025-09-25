import { useState, useEffect } from "react";

import api from "../../api/axios";
import { Link, useParams } from "react-router-dom";
import FormAddEdit from "./FormAddEdit";
import useDictionary from "../../components/store/useDictionary";

// Форма изменения товара владельцев

const EditOwnerProduct = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        storeName: "",
        productName: "",
        price: "",
        address: "",
        region: "",
        weight: "",
        category: "",

        image: null,
        dateUpdate: "",
    });

    const [images, setImages] = useState([]);
    const [main_image, setMain_image] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
      const [previews, setPreviews] = useState([]);
    // const [categories, setCategories] = useState([]);
    // const [regions, setRegions] = useState([]);
    const [errors, setErrors] = useState({});

    const {categories,  fetchCategories} = useDictionary();
    const {regions,  fetchRegions} = useDictionary();


    useEffect(() => {
        const token = localStorage.getItem("access");
        if (!token) {
            alert("Вы не вошли в аккаунт!");
            return;
        }
        // получение продукта по id для изменения
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem("access");
                const response = await api.get(`my-products/${id}/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setFormData(response.data);
                console.log("resDataEditOnwer", response.data);
                setPreviewImage(response.data.main_image);
                {
                    console.log("resImage", response.data.image);
                }
            } catch (error) {
                console.error("Ошибка при загрузке товара", error);
            }
        };

        // // получение категорий и регионов
        // const fetchCategAndRegions = async () => {
        //     try {
        //         const responseCategories = await api.get("categories/");
        //         const responseRegions = await api.get("regions/");
        //         setCategories(responseCategories.data);
        //         setRegions(responseRegions.data);
        //         {
        //             console.log("responeReg", responseRegions);
        //         }
        //     } catch (error) {
        //         console.error("Ошибка при загрузке категорий и регионов");
        //     }
        // };

        fetchProducts();
        
        fetchCategories()
        fetchRegions()
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        const previews = files
            .map((file) => {
                if (file instanceof File) {
                    return {
                        file,
                        preview: URL.createObjectURL(file),
                    };
                }
                return null;
            })
            .filter(Boolean);
           setPreviews(previews);
        setImages(files);
    };

    // Проверка обязательных полей
    const validationFrom = () => {
        const newErrors = {};
        if (!formData.storeName.trim())
            newErrors.storeName = 'поле "Название магазина обязательно" ';
        if (!formData.productName.trim())
            newErrors.productName = 'поле "Название магазина обязательно" ';
        if (!formData.address.trim())
            newErrors.address = 'поле "Название магазина обязательно" ';
        if (!formData.region)
            newErrors.region = 'поле "Название магазина обязательно" ';
        if (!formData.category)
            newErrors.category = 'поле "Название магазина обязательно" ';
        if (!formData.price.trim() && formData.price <= 0)
            newErrors.price = 'Цена не заполнено или меньше либо равно 0!" ';
          if (!formData.main_image === null ) 
             newErrors.price = 'Нет изображение товара!" '; 

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // если есть обязательные поля,  то выход из функции
        if (!validationFrom()) {
            alert("Заполните обязательные поля!");
            return;
        }

        const data = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
            if (formData[key] !== null && formData[key] !== undefined)
                data.append(key, formData[key]);
        });

        if (main_image) {
            data.append("main_image", main_image);
        }
        // if (images) {
        //     Array.from(images).forEach((file) => {
        //         data.append("product_images", file);

        //     });
        // }

         if (images.length > 0) {
            images.forEach((file) => {
                data.append("product_images", file);
            });
        }

        try {
            console.log("data");
            for (let pair of data.entries()) console.log(pair[0], pair[1]);

            const token = localStorage.getItem("access");
            await api.patch(`owner-products/${id}/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("data", data);
            alert("Товар добавлен");
        } catch (error) {
            console.error(
                "Ошибка при добавлении товара:",
                error.response?.data || error
            );
            alert("Ошибка при добавлении товара");
        }
    };

    const handleMainImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMain_image(file);
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
        }
    };

    
    return (

        <FormAddEdit edit={true} handleSubmit={handleSubmit} formData={formData} 
            regions={regions} categories={categories} 
            previewImage={previewImage} handleChange={handleChange} errors={errors}
            handleMainImage={handleMainImage} handleImageChange={handleImageChange}
            previews={previews}
         />




         //#region 
        // <form onSubmit={handleSubmit} enctype="multipart/form-data">
        //     <input
        //         type="text"
        //         name="storeName"
        //         value={formData.storeName}
        //         placeholder="Название магазина"
        //         onChange={handleChange}
        //     />
        //     <br />
        //     <br />

        //     <input
        //         type="text"
        //         name="productName"
        //         value={formData.productName}
        //         placeholder="Товар"
        //         onChange={handleChange}
        //     />
        //     <br />
        //     <br />

        //     <input
        //         type="text"
        //         name="price"
        //         placeholder="Цена"
        //         value={formData.price}
        //         onChange={handleChange}
        //     />
        //     {errors && <p style={{ color: "red" }}>{errors.price}</p>}
        //     <br />
        //     <br />

        //     <input
        //         type="text"
        //         name="address"
        //         placeholder="Адрес"
        //         value={formData.address}
        //         onChange={handleChange}
        //     />
        //     <br />
        //     <br />

        //     <input
        //         type="date"
        //         name="dateUpdate"
        //         value={formData.dateUpdate}
        //         readOnly
        //         onChange={handleChange}
        //     />
        //     <br />
        //     <br />

        //     <select
        //         name="region"
        //         value={formData.region}
        //         onChange={handleChange}
        //     >
        //         <option value="">Выбери регион</option>

        //         {regions.map((region) => (
        //             <option key={region.id} value={region.id}>
        //                 {region.nameRegions}
        //             </option>
        //         ))}
        //     </select>
        //     <br />
        //     <br />
        //     <select
        //         name="category"
        //         value={formData.category}
        //         onChange={handleChange}
        //     >
        //         <option value="">Выбери категории</option>
        //         {categories.map((cat) => (
        //             <option key={cat.id} value={cat.id}>
        //                 {cat.CategoryName}
        //             </option>
        //         ))}
        //     </select>
        //     <br />
        //     <br />

        //     <br />
        //     <br />

        //     {previewImage && (
        //         <div>
        //             <p>Текущее изображение</p>
        //             <img src={previewImage} alt="" width={30} />
        //         </div>
        //     )}

        //     <input type="file" accept="image/*" onChange={handleMainImage} />
        //     <input
        //         type="file"
        //         multiple
        //         accept="image/*"
        //         onChange={handleImageChange}
        //     />
        //     <br />
        //     <br />

        //     <button type="submit">Сохранить</button>

        //     <div>
        //         <Link to="/my-products" style={{ marginRight: "1rem" }}>
        //             Мои товары
        //         </Link>
        //     </div>
        // </form>
        //#endregion
    );
};

export default EditOwnerProduct;
