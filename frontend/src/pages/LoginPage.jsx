import LoginForm from "../components/LoginForm";
import styles from './LoginPage.module.css'

const LoginPage = () => {
    return (
        <div  className={styles['container-login-page']}>
            <h2>Вход в систему</h2>
            <LoginForm/>
        </div>
    )
}
export default LoginPage