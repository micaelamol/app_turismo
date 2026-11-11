import axios from "axios"
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export const httpClient= axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {'Content-Type': "application/json"}

})

// Antes de cada petición: adjuntar el token.
httpClient.interceptors.request.use(async (config) => {
const token = await SecureStore.getItemAsync("user_token");
if (token) config.headers.Authorization = `Bearer ${token}`;
return config;
});
// Después de cada respuesta: reaccionar a un 401 en un solo lado.
/* httpClient.interceptors.response.use(
(respuesta)  => respuesta,
(error)  =>  {
if (error.response?.status === 401) {
await SecureStore.deleteItemAsync('user_token');
    setUser(null);
    router.push("/login")
}
return Promise.reject(error);
  },
) */