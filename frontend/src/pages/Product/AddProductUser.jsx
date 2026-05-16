import { useState, useEffect } from "react";
import axios from "axios";
import api from "../../api/axios";
import { FaCamera } from "react-icons/fa";
import FormAddEdit from "./FormAddEdit";
import useDictionary from "../../components/store/useDictionary";

// Форма добавления товара

const AddProductUser = () => {
    const [formData, setFormData] = useState({
        storeName: "",
        productName: "",
        price: "",
        address: "",
        user_phone: "",
        region: "",
        weight: "",
        category: "",
        descrption: "",
        main_image: null,
    });

    const [images, setImages] = useState([]);
    const [features, setFeatures] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [preview, setPreview] = useState(null);
    const [previewsAdd, setPreviewsAdd] = useState(null);
    const [main_image, setMain_image] = useState(null);
    // const [categories, setCategories] = useState([]);
    // const [regions, setRegions] = useState([]);
    const [dateUpdate, setDateUpdate] = useState("");
    const [errors, setErrors] = useState({});
    const [categoryFeatures, setCategoryFeatures] = useState([]);
    const [featureValues, setFeatureValues] = useState({});

    const { categories, fetchCategories } = useDictionary();
    const { regions, fetchRegions } = useDictionary();
    // получаем категории и регионы
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, dateUpdateUser: today }));
        setDateUpdate(today);
        console.log("today", today);
        fetchCategories();
        fetchRegions();
    }, []);

    const handleFeatureChange = (featureId, value) => {
        setFeatureValues((prev) => ({ ...prev, [featureId]: value }));
    };

    // const fetchCategories = async () => {
    //     try {
    //         const responseCategories = await api.get("categories/");
    //         setCategories(responseCategories.data);
    //         const responseRegions = await api.get("regions/");
    //         setRegions(responseRegions.data);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };

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


    const handleChange = (e) => {
        // setFormData({ ...formData, [e.target.name]: e.target.value });
        
           
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    
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
        // console.log("priviews - ", previews);
        setPreviewsAdd(previews);
        setImages(files);
    };

    // Проверка обязательных полей
    const validationFrom = () => {
        const newErrors = {};
        if (!formData.storeName.trim())
            newErrors.storeName = '"Название магазина не заполнено" ';
        if (!formData.productName.trim())
            newErrors.productName = '"Имя товара не заполнено" ';
        if (!formData.address.trim())
            newErrors.address = ' "Адрес магазина не заполнено" ';
        if (!formData.region)
            newErrors.region = 'поле "Имя региона не заполнено" ';
        if (!formData.category) newErrors.category = '"Категория  не выбрано" ';
        if (!formData.price.trim() && formData.price <= 0)
            newErrors.price = 'Цена не заполнено или меньше либо равно 0!" ';
        if (!main_image) newErrors.main_image = 'Нет изображение товара!" ';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();

        for (const key in formData) {
            data.append(key, formData[key]);
        }

        // console.log(images);
        

        if (main_image) {
            data.append("main_image", main_image);
        }
        if (images.length > 0) {
            images.forEach((file) => {
                data.append("product_images", file);
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

        if (!validationFrom()) {
            alert("Обязательные поля не заполнены!");
            return;
        }

        const token = localStorage.getItem("access");
        const isAuthenticated = token;

        const endPoint = isAuthenticated
            ? "http://127.0.0.1:8000/api/owner-products/"
            : "http://127.0.0.1:8000/api/products/";

        try {
            console.log("data in AddProdUser");
            for (let pair of data.entries()) console.log(pair[0], pair[1]);

            console.log("endPoint = ", endPoint);
            const token = localStorage.getItem("access");
            console.log("data ", data);
            const res = await api.post(endPoint, data, {
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
        <FormAddEdit
            edit={false}
            handleSubmit={handleSubmit}
            formData={formData}
            regions={regions}
            categories={categories}
            previewImage={preview}
            handleChange={handleChange}
            errors={errors}
            handleMainImage={handleMainImage}
            handleImageChange={handleImageChange}
            previews={previews}
            previewsAdd={previewsAdd}
            categoryFeatures={categoryFeatures}
            featureValues={featureValues}
            handleFeatureChange={handleFeatureChange}
        />

        
    );
};

export default AddProductUser;
