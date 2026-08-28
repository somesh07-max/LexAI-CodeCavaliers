import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

let accessToken = null;
let onSessionExpired = () => {};
let refreshPromise = null;

export const setAccessToken = (token) => { accessToken = token; };
export const setSessionExpiredHandler = (handler) => { onSessionExpired = handler; };
export const apiMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

export const api = axios.create({ baseURL: API_URL, withCredentials: true });
const refreshClient = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isRefresh = original?.url?.includes('/auth/refresh-token');
    if (error.response?.status !== 401 || original?._retried || isRefresh) throw error;
    original._retried = true;
    try {
      refreshPromise ||= refreshClient.post('/auth/refresh-token').finally(() => { refreshPromise = null; });
      const { data } = await refreshPromise;
      setAccessToken(data.accessToken);
      original.headers = { ...original.headers, Authorization: `Bearer ${data.accessToken}` };
      return api(original);
    } catch (refreshError) {
      setAccessToken(null);
      onSessionExpired();
      throw refreshError;
    }
  },
);

export const restoreAccessToken = async () => {
  const { data } = await refreshClient.post('/auth/refresh-token');
  setAccessToken(data.accessToken);
  return data;
};
