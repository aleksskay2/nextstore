import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./FormAddEdit.module.css";
import { FaCamera } from "react-icons/fa";
import { cn } from "../../utils/cn";

const FormAddEdit = ({
    edit,
    handleSubmit,
    formData,
    regions,
    categories,
    previewImage,
    handleChange,
    errors,
    handleMainImage,
    handleImageChange,
    previews,
}) => {
    const [update, setUpdate] = useState();
    const [user, setUser] = useState(false);

    const checkUser = async () => {
        const access = localStorage.getItem('access')

            if (access) {
              setUser(true)
        }
    }
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        // setFormData((prev) => ({ ...prev, dateUpdateUser: today }));
        setUpdate(today);
        checkUser()
    },[]);
    return (
        <div className={cn(styles.container)}>
            <div className={styles['container__content']}>
                 <h3>Добавление товара</h3>
              
                
                <form
                    className={cn(styles.container__form, styles.form)}
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                >
                    <div className={cn(styles.form__store - name)}>
                        <input
                            type="text"
                            name="storeName"
                            value={formData.storeName || ""}
                            placeholder="Название магазина"
                            onChange={handleChange}
                        />
                    </div>

                    {errors && (
                        <p style={{ color: "red" }}>{errors.storeName}</p>
                    )}

                    <input
                        className={cn(styles.form__product - name)}
                        type="text"
                        name="productName"
                        value={formData.productName}
                        placeholder="Имя товара"
                        onChange={handleChange}
                    />
                    {errors && (
                        <p style={{ color: "red" }}>{errors.productName}</p>
                    )}

                    <input
                        className={cn(styles.form__product)}
                        type="text"
                        name="price"
                        placeholder="Цена"
                        value={formData.price}
                        onChange={handleChange}
                    />
                    {errors && <p style={{ color: "red" }}>{errors.price}</p>}

                    <input
                        className={cn(styles.form__address)}
                        type="text"
                        name="address"
                        placeholder="Адрес"
                        value={formData.address}
                        onChange={handleChange}
                    />
                    {errors && <p style={{ color: "red" }}>{errors.address}</p>}

                    <input
                        className={cn(styles.dateUpdate)}
                        type="date"
                        name="dateUpdate"
                        value={update || ""}
                        readOnly
                        onChange={handleChange}
                    />

                    <br />
                    <select
                        className={cn(styles.form__region)}
                        name="region"
                        value={formData.region || ""}
                        onChange={handleChange}
                    >
                        <option value="">Выбери регион</option>

                        {regions.map((region) => (
                            <option key={region.id} value={region.id}>
                                {region.nameRegions}
                            </option>
                        ))}
                    </select>
                    {errors && <p style={{ color: "red" }}>{errors.region}</p>}
                   

                    <select
                        className={cn(styles.form__category)}
                        name="category"
                        value={formData.category || ""}
                        onChange={handleChange}
                    >
                        <option value="">Выбери категории</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.CategoryName}
                            </option>
                        ))}
                    </select>
                    {errors && (
                        <p style={{ color: "red" }}>{errors.category}</p>
                    )}
                    <br />

                    {/* {previewImage && (
                    <div className={styles["form__image"]}>
                        <p>Текущее изображение</p>
                        <img src={previewImage} alt="" width={30} />
                    </div>
                )} */}

                    <div className={styles["main-image"]}>
                        {previewImage && (
                            <img
                                className={styles["main-image__img"]}
                                src={previewImage}
                                alt=""
                            />
                        )}

                        <input
                            className={styles["form__input-main"]}
                            id="fileMainInput"
                            type="file"
                            accept="image/*"
                            name="main_image"
                            style={{
                                visibility: "hidden",
                                display: "none",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                            onChange={handleMainImage}
                        />
                        {errors && (
                            <p style={{ color: "red" }}>{errors.main_image}</p>
                        )}

                        {
                            (edit === false ) ? (
                                (!previewImage) && (
                            <label
                            style={{
                                backgroundColor: "lightblue",
                                padding: "2px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                borderRadius:'5px',
                                marginBottom:'10px'
                                
                            }}
                            htmlFor="fileMainInput"
                        >
                            <FaCamera size={20} />

                            <span>Главное фото</span>
                        </label>
                            )
                        ):(
                              (!edit && previewImage) && (
                            <label
                            style={{
                                backgroundColor: "lightblue",
                                padding: "2px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                borderRadius:'5px',
                                marginBottom:'10px'
                                
                            }}
                            htmlFor="fileMainInput"
                        >
                            <FaCamera size={20} />

                            <span>Главное фото</span>
                        </label>
                        )
                        
                        )
                     
                        }
                        
                    </div>

                    {previews &&
                        previews.map(
                            (item) =>
                                item && (
                                    <img src={item.preview} alt="" width={40} />
                                )
                        )}

                    <input
                        multiple
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        style={{
                          
                            display: "none",
                            
                        }}
                        onChange={handleImageChange}
                    />

                    <label className={styles['form__additional-photo']}
                        style={{
                            backgroundColor: "lightblue",
                            padding: "2px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                        htmlFor="fileInput"
                    >
                        <FaCamera size={20} />

                        <span>Дополнительные фото</span>
                    </label>

                    <button className={styles["form__sumbit"]} type="submit">
                        Добавить товар
                    </button>

                    <div className={styles['container__my-products']}>
                        <div className={styles["form__my-products"]}>
                        {
                            (user) && (
                                <Link to="/my-products" 
                                style={{ marginRight: "1rem" }}>
                                    Мои товары
                                </Link>
                            )
                        }

                    </div>
                 
                    </div>
                   
                </form>
            </div>
        </div>
    );
};
export default FormAddEdit;
