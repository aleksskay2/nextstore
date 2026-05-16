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
    const [main_image_webp, setMain_image_webp] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [previewsAdd, setPreviewsAdd] = useState(null);
    const [previews, setPreviews] = useState([]);
    // const [categories, setCategories] = useState([]);
    // const [regions, setRegions] = useState([]);
    const [errors, setErrors] = useState({});
    const [categoryFeatures, setCategoryFeatures] = useState([]);
    const [featureValues, setFeatureValues] = useState({});

    const { categories, fetchCategories } = useDictionary();
    const { regions, fetchRegions } = useDictionary();

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
                setPreviewImage(response.data.main_image_webp);
                setPreviewsAdd(response.data.images);
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

        fetchCategories();
        fetchRegions();
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
        if (!formData.main_image_webp === null)
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

        for (const key in formData) {
            if (key !== "user" && key !== "owner")
                data.append(key, formData[key]);
        }

        if (images) {
            Array.from(images).forEach((file) => {
                data.append("product_images", file.file);
            });
        }

        if (main_image_webp) {
            data.append("main_image_webp", main_image_webp);
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

        //     const featuresArray = Object.entries(featureValues)
        // .filter(([_, value]) => value.trim() !== "") // только непустые
        // .map(([templateId, value]) => ({
        // feature_template: parseInt(templateId),
        // valueFeature: value.trim(),
        // }));

        // data.append("features", JSON.stringify(featuresArray));

        if (Object.keys(featureValues).length > 0) {
            const featuresArray = Object.entries(featureValues).map(
                ([feature_template, valueFeature]) => ({
                    feature_template,
                    valueFeature,
                })
            );
            data.append("features", JSON.stringify(featuresArray));
        }

        // Сохраняем обновленные данные для владельца
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
            setMain_image_webp(file);
          
            const imageUrl = URL.createObjectURL(file);
            console.log('image_url - ', imageUrl)
            setPreviewImage(imageUrl);
        }
    };

      useEffect(() => {
            if (formData.features) {
                const initialValues = {};
                formData.features.forEach((f) => {
                    initialValues[f.feature_template] = f.valueFeature;
                });
                setFeatureValues( initialValues);
            }
        }, [formData.features]);
    

    return (
        <>
           <img src={previewImage} alt="" width={49} height={45} />
        <FormAddEdit
            edit={true}
            handleSubmit={handleSubmit}
            formData={formData}
            regions={regions}
            categories={categories}
            previewImage={previewImage}
            handleChange={handleChange}
            errors={errors}
            handleMainImage={handleMainImage}
            handleImageChange={handleImageChange}
            previewsAdd={previewsAdd}
            priviews={previews}
            categoryFeatures={categoryFeatures}
            featureValues={featureValues}
            handleFeatureChange={handleFeatureChange}
        />
        </>

        
    );
};

export default EditOwnerProduct;
