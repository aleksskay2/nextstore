import { Link, useNavigate } from "react-router-dom";
import { parseJwt } from "../../utils/jwt";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import useStore from "../../components/store/store";
import styles from "./Profile.module.css";
import { useAppStore } from "../../components/store/appStore";
import { useOnlineStore } from "../../components/store/useOnlineStore";

const Profile = () => {
  const token = localStorage.getItem("access");
  // const userData = token ? parseJwt(token):null;
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { logout } = useStore();
  // const {closeWebSocket} = useAppStore

  useEffect(() => {
    fetchUser();
  }, [token, navigate]);

  // const isAuthenticated = !! token;

  // информация о  текущем пользователе.
  const fetchUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.get("user/");
      console.log("response", response);
      setUser(response.data);
    } catch (error) {
      console.log("error", error);

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        await api.post("/logout/", { refresh });
      }
    } catch (error) {
      console.log("Ошибка при выходе", error.response?.data || error.message);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      useAppStore.getState().logout();
      useOnlineStore.getState().clearOnline();
      setUser(null);
      // logout()
      setTimeout(() => navigate("/login"), 0);
    }
  };

  return (
    <>
      <div className={styles["container"]}>
        <nav>
          {/* <Link to="/">Главная</Link> | */}

          <div>
            {isLoading ? (
              <span> ... Загрузка</span>
            ) : user ? (
              <>
                <div className={styles["profile__content"]}>
                  <div className={styles["profile__hello"]}>
                    <Link to={`/user/${user.id}`}>Привет, {user.username}</Link>
                  </div>
                  <div className={styles["profile__products"]}>
                    <Link to="/my-products" style={{ marginRight: "1rem" }}>
                      Мои товары
                    </Link>
                  </div>
                  <div className={styles["profile__group"]}>
                    <Link to="/group" style={{ marginRight: "1rem" }}>
                      Создать группу
                    </Link>
                  </div>

                  <div>
                    <button onClick={handleLogout}>Выйти</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-300">
                  Войти
                </Link>
                |<Link to="/register">Регистрация</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};
export default Profile;
