// import axios from 'axios'

// const api = axios.create({
//     'baseURL':'http://127.0.0.1:8000/api/',
//     'headers':{'Content-Type': 'application/json'}
// })


// api.interceptors.request.use(
//     (config) => {
//         const access = localStorage.getItem('access')
//         if (access) {
//             config.headers.Authorization = `Bearer ${access}`
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// )

// // Автообновление access токена
// api.interceptors.response.use(
//     (response) => response, 
//     async(error) => {
//         const originalRequest = error.config;

//         if (error.response?.status === 401 && !originalRequest._retry){
//             originalRequest._retry =true;

//             const refresh = localStorage.getItem('refresh')
//             if (!refresh) {
//                 window.location.href ='/login'
//                 return Promise.reject(error)
//             }
//             try {
//                 const response = await api.post('/token/refresh/', {
//                     refresh,
//                 });
                
//                 const newAccess = response.data.access;
                
//                 const {access, refresh:newRefresh} = response.data;
//                 localStorage.setItem('access', access);
//                 if (newRefresh) {
//                     localStorage.setItem('refresh',newRefresh);
//                 }
//                 originalRequest.headers.Authorization = `Bearer ${newAccess}`;

//                 return api(originalRequest); // повтор запроса
//             }
//             catch(refreshError) {
//                 console.error('Ошибка обновления токена', refreshError.response?.data || refreshError);
//                 localStorage.removeItem('access')
//                 localStorage.removeItem('refresh')
//                 window.location.href = '/login'
//             }
//         } 
//         return Promise.reject(error)
//     }
// )


// export default api


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
//         console.log('Запрос:', config.method.toUpperCase(), config.url, 'Токен:', access || 'отсутствует');
//         return config;
//     },
//     (error) => {
//         console.error('Ошибка в запросе:', error);
//         return Promise.reject(error);
//     }
// );

// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             const refresh = localStorage.getItem('refresh');
//             if (!refresh) {
//                 console.warn('Refresh-токен отсутствует, перенаправление на /loginForm');
//                 localStorage.removeItem('access');
//                 localStorage.removeItem('refresh');
//                 window.location.href = '/login';
//                 return Promise.reject(error);
//             }

//             try {
//                 console.log('Отправка запроса на обновление токена:', '/token/refresh/', { refresh });
//                 const response = await api.post('/token/refresh/', { refresh });
//                 console.log('Ответ /token/refresh/:', response.data);
//                 const { access, refresh: newRefresh } = response.data;
//                 localStorage.setItem('access', access);
//                 if (newRefresh) {
//                     console.log('Сохранение нового refresh-токена:', newRefresh);
//                     localStorage.setItem('refresh', newRefresh);
//                 }
//                 originalRequest.headers.Authorization = `Bearer ${access}`;
//                 console.log('Повтор оригинального запроса:', originalRequest.url);
//                 return api(originalRequest);
//             } catch (refreshError) {
//                 console.error('Ошибка при обновлении токена:', refreshError.response?.data || refreshError.message);
//                 console.error('Статус ошибки:', refreshError.response?.status);
//                 console.error('Отправленный refresh-токен:', refresh); // Логируем refresh-токен для анализа
//                 localStorage.removeItem('access');
//                 localStorage.removeItem('refresh');
//                 window.location.href = '/login';
//                 return Promise.reject(refreshError);
//             }
//         }
//         console.error('Ошибка ответа:', error.response?.data || error.message, 'Статус:', error.response?.status);
//         return Promise.reject(error);
//     }
// );

// export default api;



import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    headers: { 'Content-Type': 'application/json' },
});

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

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если токен устарел, пробуем обновить
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refresh = localStorage.getItem('refresh');
            if (!refresh) {
                // Токены отсутствуют — выход
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const res = await axios.post('http://127.0.0.1:8000/api/token/refresh/', { refresh });
                const { access, refresh: newRefresh } = res.data;
                localStorage.setItem('access', access);
                if (newRefresh) {
                    localStorage.setItem('refresh', newRefresh);
                }

                // Устанавливаем новый access токен для повторного запроса
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
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