import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Додаємо JWT до кожного запиту
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Централізовано обробляємо помилки авторизації
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem("token");

      const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;

      // Зберігаємо адресу, яку користувач намагався відкрити
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        const returnUrl = encodeURIComponent(currentPath);

        window.location.replace(`/login?returnUrl=${returnUrl}`);
      }
    }

    return Promise.reject(error);
  },
);

export default api;