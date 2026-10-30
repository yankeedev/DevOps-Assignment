import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const backendBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: backendBaseUrl,
  withCredentials: true,
});

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    const headers = config.headers ?? {};
    (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean });
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const refreshUrl = backendBaseUrl
          ? `${backendBaseUrl}/auth/refresh`
          : "/auth/refresh";
        const { data } = await axios.post(refreshUrl, {}, { withCredentials: true });

        setAccessToken(data.accessToken as string);
        const headers = original.headers ?? {};
        (headers as Record<string, string>).Authorization = `Bearer ${data.accessToken}`;
        original.headers = headers;
        return api(original);
      } catch {
        setAccessToken(null);
      }
    }

    return Promise.reject(error);
  }
);
