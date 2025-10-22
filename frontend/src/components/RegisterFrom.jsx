import { useState } from "react";
import axios from "axios";

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        phone: "",
        region: "",
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = axios.post(
                "http://127.0.0.1:8000/api/register/",
                formData
            );
            console.log(response.data);
            setMessage("Регистрация прошла успешна");
        } catch (error) {
            console.log(error.message);
            setMessage("Ошибка при регистрации");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="username"
                placeholder="Имя пользователя"
                onChange={handleChange}
            />
            <br />
            <br />
            <input
                type="text"
                name="password"
                placeholder="Пароль"
                onChange={handleChange}
            />
            <br />
            <br />
            <input
                type="email"
                name="email"
                placeholder="почта"
                onChange={handleChange}
            />
            <br />
            <br />
            <input
                type="text"
                name="phone"
                placeholder="телефон"
                onChange={handleChange}
            />
            <br />
            <br />
            <input
                type="text"
                name="region"
                placeholder="регион"
                onChange={handleChange}
            />
            <button type="submit">Зарегистрироваться</button>
            <p>{message}</p>
        </form>
    );
};

export default RegisterForm;
