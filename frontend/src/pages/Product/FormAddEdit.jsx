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
    previewsAdd,
    preview,
    categoryFeatures,
    featureValues,
    handleFeatureChange,
}) => {
    const [update, setUpdate] = useState();
    const [user, setUser] = useState(false);

    const checkUser = async () => {
        const access = localStorage.getItem("access");

        if (access) {
            setUser(true);
        }
    };
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        // setFormData((prev) => ({ ...prev, dateUpdateUser: today }));
        setUpdate(today);
        checkUser();
    }, []);

    return (
        <div className={cn(styles.container)}>
            <div className={styles["container__content"]}>
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
                        className={cn(styles.form__address)}
                        type="text"
                        name="user_phone"
                        placeholder="Номер телефона"
                        value={formData.user_phone}
                        onChange={handleChange}
                    />

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

                    <label>
                        <input
                            type="checkbox"
                            name="is_vip"
                            checked={formData.is_vip || false}
                            onChange={handleChange}
                        />
                        Сделать VIP (платно)
                        </label>
                    {edit === false
                        ? categoryFeatures &&
                          categoryFeatures.length > 0 && (
                              <div style={{ marginTop: "1rem" }}>
                                  <h4>Харектеристики</h4>
                                  {categoryFeatures.map((ft) => (
                                      <div
                                          key={ft.id}
                                          style={{ marginTop: "10px" }}
                                      >
                                          <input
                                              type="text"
                                              placeholder={`Введите ${ft.nameFeature}`}
                                              value={featureValues[ft.id] || ""}
                                              onChange={(e) =>
                                                  handleFeatureChange(
                                                      ft.id,
                                                      e.target.value
                                                  )
                                              }
                                              style={{ marginLeft: "10px" }}
                                          />
                                      </div>
                                  ))}
                              </div>
                          )
                        : categoryFeatures.length > 0 && (
                              <div style={{ marginTop: "1rem" }}>
                                  <h4>Характеристики</h4>

                                  {categoryFeatures.map((ft) => {
                                      // ищем, есть ли уже сохранённое значение для этой характеристики
                                      const existingFeature =
                                          formData.features?.find(
                                              (f) =>
                                                  f.feature_template === ft.id
                                          );

                                      return (
                                          <div key={ft.id}>
                                              <label
                                                  style={{
                                                      display: "block",
                                                      fontSize: "12px",
                                                  }}
                                              >
                                                  {ft.nameFeature}
                                              </label>
                                              <input
                                                  type="text"
                                                  placeholder={`Введите ${ft.nameFeature}`}
                                                  value={
                                                      featureValues[ft.id] !==
                                                      undefined
                                                          ? featureValues[ft.id] // если пользователь уже что-то ввёл
                                                          : existingFeature?.valueFeature ||
                                                            "" // иначе заполняем старым значением
                                                  }
                                                  onChange={(e) =>
                                                      handleFeatureChange(
                                                          ft.id,
                                                          e.target.value
                                                      )
                                                  }
                                                  style={{
                                                      width: "100%",
                                                      padding: "5px",
                                                  }}
                                              />
                                          </div>
                                      );
                                  })}
                              </div>
                          )}

                    {/* {previewImage && (
                <div className={styles["form__image"]}>
                    <p>Текущее изображение</p>
                    <img src={previewImage} alt="" width={30} />
                </div> 
            )}   */}

                    <div className={styles["desc__item-text"]}>
                        <textarea
                            name="description"
                            id=""
                            value={formData.description || ""}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                    {/* {console.log("previewImage in Form", previewImage)} */}

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
                            name="main_image_webp"
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

                        {edit === false
                            ?    (
                                  <label
                                      style={{
                                          backgroundColor: "lightblue",
                                          padding: "2px",
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          borderRadius: "5px",
                                          marginBottom: "10px",
                                      }}
                                      htmlFor="fileMainInput"
                                  >
                                      <FaCamera size={20} />

                                      <span>Главное фото</span>
                                  </label>
                              )
                            : previewImage && (
                                  <label
                                      style={{
                                          backgroundColor: "lightblue",
                                          padding: "2px",
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          borderRadius: "5px",
                                          marginBottom: "10px",
                                      }}
                                      htmlFor="fileMainInput"
                                  >
                                      <FaCamera size={20} />

                                      <span>Главное фото</span>
                                  </label>
                              )}
                    </div>

                    {/* {console.log("previews", preview)} */}

                    {/* {
                        
                        (
                        previews &&
                    previews.map(
                        (item) =>
                            item && (
                                <img src={item.preview} alt="" width={40} />
                            )
                    )
                    )
                } */}

                    {/* {console.log("previewsAdd", previewsAdd)} */}

                    {previewsAdd &&
                        previewsAdd.map(
                            (item) =>
                                item && (
                                    <img src={item.preview} alt="" width={40} />
                                )
                        )}

                
                    {previewsAdd &&
                        edit &&
                        previewsAdd.map(
                            (item) =>
                                item && (
                                    <img src={item.image} alt="" width={40} />
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

                    <label
                        className={styles["form__additional-photo"]}
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

                    <div className={styles["container__my-products"]}>
                        <div className={styles["form__my-products"]}>
                            {user && (
                                <Link
                                    to="/my-products"
                                    style={{ marginRight: "1rem" }}
                                >
                                    Мои товары
                                </Link>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default FormAddEdit;
