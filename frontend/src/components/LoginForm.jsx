import { useState } from "react";
import axios from "axios";

const LoginForm = () => {
    const [formData, setFormData] = useState({username:'', password: ''});
    const [message, setMessage] = useState('')


    const handleChange = e => {
        setFormData( prev =>({
            ...prev, [e.target.name]: e.target.value}))
    }


    const handleSubmit = async e => {
        e.preventDefault();

        console.log(formData.username, formData.password)
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/', formData);
            localStorage.setItem('access', response.data.access)
            localStorage.setItem('refresh', response.data.refresh)
            alert('Вы успешно вошли')
        }
        catch(error){
            console.log(error.response?.data)
            alert('Неверный пароль или логин')
            
        }
    } 


    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="username" placeholder="Логин" onChange={handleChange} required  />
            <input type="password" name="password"
             placeholder="Пароль" onChange={handleChange} required  />
            <button type="submit">Войти</button>
        </form>
    )
}
export default LoginForm;