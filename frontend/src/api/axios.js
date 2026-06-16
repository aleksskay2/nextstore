


//  для локальной разработки с Django и React, 



// import axios from 'axios';

// const api = axios.create({
//     baseURL: 'http://127.0.0.1:8000/api/',
//     headers: { 'Content-Type': 'application/json' },
// });

// api.interceptors.request.use(
//     (config) => {
//         const access = localStorage.getItem('access');
//         if (access) {
//             config.headers.Authorization = `Bearer ${access}`;
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         // Если токен устарел, пробуем обновить
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             const refresh = localStorage.getItem('refresh');
//             if (!refresh) {
//                 // Токены отсутствуют — выход
//                 localStorage.removeItem('access');
//                 localStorage.removeItem('refresh');
//                 window.location.href = '/login';
//                 return Promise.reject(error);
//             }

//             try {
//                 const res = await axios.post('http://127.0.0.1:8000/api/token/refresh/', { refresh });
//                 const { access, refresh: newRefresh } = res.data;
//                 localStorage.setItem('access', access);
//                 if (newRefresh) {
//                     localStorage.setItem('refresh', newRefresh);
//                 }

//                 // Устанавливаем новый access токен для повторного запроса
//                 originalRequest.headers.Authorization = `Bearer ${access}`;
//                 return api(originalRequest);
//             } catch (refreshError) {
//                 localStorage.removeItem('access');
//                 localStorage.removeItem('refresh');
//                 window.location.href = '/login';
//                 return Promise.reject(refreshError);
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default api;












import axios from 'axios';

// 🔥 ГЛАВНЫЙ ПЕРЕКЛЮЧАТЕЛЬ 🔥
// Поставь `true`, чтобы сайт смотрел на боевой сервер Render.
// Поставь `false`, если нужно запустить бэкенд локально.
const IS_PRODUCTION = true;

const LOCAL_URL = 'http://127.0.0.1:8000/api/';
const PROD_URL = 'https://nextstore-iumj.onrender.com/api/';

export const API_BASE_URL = IS_PRODUCTION ? PROD_URL : LOCAL_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ==========================================
// ПЕРЕХВАТЧИК ЗАПРОСОВ
// ==========================================
api.interceptors.request.use(
    (config) => {
        const access = localStorage.getItem('access');
        if (access) {
            config.headers.Authorization = `Bearer ${access}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// ПЕРЕХВАТЧИК ОТВЕТОВ
// ==========================================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если получаем 401 и мы еще не пытались повторить запрос
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            const refresh = localStorage.getItem('refresh');
            
            // 🔥 Защита: если рефреш-токена нет вообще (пользователь не авторизован),
            // сразу кидаем на страницу входа, не делая лишних запросов.
            if (!refresh) {
                console.log("[API] Токены отсутствуют. Редирект на логин.");
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // 🔥 Запрашиваем новый токен по динамическому URL (Render или localhost)
                // Используем оригинальный axios, чтобы не зациклить интерцепторы
                const res = await axios.post(`${API_BASE_URL}token/refresh/`, { refresh });
                
                const { access, refresh: newRefresh } = res.data;
                
                localStorage.setItem('access', access);
                if (newRefresh) {
                    localStorage.setItem('refresh', newRefresh);
                }

                // Устанавливаем новый access токен для повторного оригинального запроса
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);

            } catch (refreshError) {
                // Если обновление токена провалилось (например, рефреш тоже протух)
                console.error("[API] Ошибка обновления токена:", refreshError);
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;