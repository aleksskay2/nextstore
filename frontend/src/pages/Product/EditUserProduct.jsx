import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useParams } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import FormAddEdit from "./FormAddEdit";
import useDictionary from "../../components/store/useDictionary";

// Форма добавления товара

const EditUserProduct = () => {
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
    });

    const [main_image, setMain_image] = useState(null);
    const [images, setImages] = useState([]);
    const [preview, setPreview] = useState(null);
    const [previews, setPreviews] = useState([]);
    const [previewsAdd, setPreviewsAdd] = useState(null);

    const [categoryFeatures, setCategoryFeatures] = useState([]);
    const [featureValues, setFeatureValues] = useState({});

    // const [categories, setCategories] = useState([])
    // const [regions, setRegions] = useState([])
    const [errors, setErrors] = useState({});

    const { categories, fetchCategories } = useDictionary();
    const { regions, fetchRegions } = useDictionary();

    const handleFeatureChange = (featureId, value) => {
        setFeatureValues((prev) => ({ ...prev, [featureId]: value }));
    };

    useEffect(() => {
        const getFeautesByCategory = async () => {
            try {
                if (formData.category) {
                    const res = await api.get(
                        `/categories/${formData.category}/features/`
                    );
                    setCategoryFeatures(res.data);
                    setFeatureValues({}); // убираем старые значения
                }
            } catch (error) {
                console.error("Ошибка при загрузке харектеристик:", err);
            }
        };
        getFeautesByCategory();
    }, [formData.category]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get(`edit-user-products/${id}/`);
                setFormData(response.data);
                setPreview(response.data.main_image_webp);
                setPreviewsAdd(response.data.images);
                
                {
                    console.log("resImage", response.data.main_image);
                }

                console.log("resDataEditUser", response.data);
            } catch (error) {
                console.error("Ошибка при загрузке товара", error);
            }
        };

        fetchProducts(), fetchCategories(), fetchRegions();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
        setPreviewsAdd(previews);
        setImages((prev) => [...prev, ...previews]);
    };

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        {
            console.log("formData", formData);
        }

        // если есть обязательные поля,  то выход из функции
        if (!validationFrom()) {
            alert("Заполните обязательные поля!");
            return;
        }

        const data = new FormData();

        for (const key in formData) {
            if (key !== "user" && key !== "owner")
                data.append(key, formData[key]);
        }

        if (main_image) {
            console.log("main_image - ", main_image);
            data.append("main_image", main_image);
        }

        if (images) {
            Array.from(images).forEach((file) => {
                data.append("product_images", file.file);
            });
        }

        if (Object.keys(featureValues).length > 0) {
            const featuresArray = Object.entries(featureValues).map(
                ([feature_template, valueFeature]) => ({
                    feature_template,
                    valueFeature,
                })
            );
            data.append("features", JSON.stringify(featuresArray));
        }

        const token = localStorage.getItem("access");
        const isAuthenticated = !!token;

        const endPoint = `edit-user-products/${id}/`;

        try {
            console.log("data ");
            for (let pair of data.entries()) {
                console.log(pair[0], pair[1]);
            }
            const response = await api.patch(endPoint, data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            alert("Товар добавлен");
        } catch (error) {
            console.error(
                "Ошибка при добавлении товара:",
                error.response?.date || error
            );
            alert("Ошибка при добавлении товара");
        }
    };

    const handleMainImage = (e) => {
        if (e.target.files && e.target.files[0]) {
            setMain_image(e.target.files[0]);
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
        }
    };

    return (
        <div>
            <img src={preview} alt="" width={49} height={45} />

            <FormAddEdit
                edit={true}
                handleSubmit={handleSubmit}
                formData={formData}
                regions={regions}
                categories={categories}
                previewImage={preview}
                handleChange={handleChange}
                errors={errors}
                handleMainImage={handleMainImage}
                handleImageChange={handleImageChange}
                previewsAdd={previewsAdd}
                categoryFeatures={categoryFeatures}
                featureValues={featureValues}
                handleFeatureChange={handleFeatureChange}
            />
        </div>

        //#region
        // <form onSubmit={handleSubmit}>
        //      {
        //         console.log('id', id)
        //      }
        //     <input type="text" name="storeName" value={formData.storeName}
        //      placeholder="Название магазина" onChange={handleChange} />
        //     <br /><br />

        //     <input type="text" name="productName" value={formData.productName}
        //     placeholder="Товар" onChange={handleChange} />
        //      <br /><br />

        //     <input type="text" name="price" placeholder="Цена"  value={formData.price}
        //      onChange={handleChange} />
        //     <br /><br />

        //     <input type="text" name="address" placeholder="Адрес" value={formData.address}
        //     onChange={handleChange} />
        //   <br /><br />

        //     <input type="date" name="dateUpdate" value={formData.dateUpdate}
        //      readOnly onChange={handleChange} />
        // <br /><br />

        //     <select name="region" value={formData.region} onChange={handleChange}>
        //         <option value="">Выбери регион</option>

        //         {regions.map(region => (
        //             <option key={region.id} value={region.id}>{region.nameRegions}</option>
        //         ))}
        //     </select>
        //     <br /><br />
        //     <select name="category" value={formData.category} onChange={handleChange}>

        //         <option value="">Выбери категории</option>
        //         {

        //             categories.map(cat => (
        //                 <option key={cat.id} value={cat.id}>{cat.CategoryName}</option>
        //             ))
        //         }
        //     </select>
        //     <br /><br />

        //     <h3>Главное</h3>
        //                <div>
        //                 { console.log('preview - ' , preview)}
        //                {

        //                    (preview) && (
        //                        <img
        //                            src={preview}
        //                            alt=""
        //                            width={40}
        //                            />
        //                    )
        //                }

        //                <input
        //                    id='fileMainInput'
        //                    type="file"
        //                    accept="image/*"
        //                    style={{visibility:'hidden',
        //                        display:'flex',
        //                        flexDirection:'column',
        //                        alignItems:'center'
        //                    }}
        //                    onChange={handleMainImage} />

        //                    <label  style={{backgroundColor:'lightblue',
        //                        padding:'2px',
        //                        display:'flex',
        //                        flexDirection:'column',
        //                        alignItems:'center'

        //                    }} htmlFor="fileMainInput">
        //                        <FaCamera size={20}/>

        //                        <span>Главное фото</span>
        //                </label>
        //                </div>

        //                {
        //                    previews.map(item => (
        //                         (item) && (
        //                        <img
        //                            src={item.preview}
        //                            alt=""
        //                            width={50}
        //                            />
        //                    )
        //                    ))

        //                }

        //                 <input  multiple
        //                    id='fileInput'
        //                    type="file"
        //                    accept="image/*"
        //                    style={{visibility:'hidden',
        //                        display:'flex',
        //                        flexDirection:'column',
        //                        alignItems:'center'
        //                    }}
        //                    onChange={handleImageChange} />

        //                    <label  style={{backgroundColor:'lightblue',
        //                        padding:'2px',
        //                        display:'flex',
        //                        flexDirection:'column',
        //                        alignItems:'center'

        //                    }} htmlFor="fileInput">
        //                        <FaCamera size={20}/>

        //                        <span>Дополнительные фото</span>
        //                </label>

        //      <br />

        //     <button type="submit">Сохранить</button>

        // </form>
        //#endregion
    );
};

export default EditUserProduct;
