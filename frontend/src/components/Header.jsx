import {Link} from 'react-router-dom'

const Header = () => {
    return (
        <nav>
            <Link to="/">Главная</Link> |
            <Link to="/register" >Регистрация</Link>|
            <Link to='/login'>Войти</Link>|
            <Link to="productuser/">Список товаров</Link>|
            <Link to="/add-product">Добавить товар</Link>
        </nav>
    )
  
}
export default Header;