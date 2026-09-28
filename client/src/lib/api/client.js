import axios from "axios";
import i18n from "@/i18n";

const TOKEN_KEY = "token";
export const UNAUTHORIZED_EVENT = "mumwell:unauthorized";

export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api`,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // The server replies (errors, AI, emails) in this language.
  config.headers["Accept-Language"] = i18n.resolvedLanguage || "en";
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or revoked session anywhere in the app signs the user out.
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && tokenStorage.get() && !url.startsWith("/auth/login")) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Human-friendly, translated message for a failed request (the server localises its messages). */
export function getErrorMessage(error, fallback) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === "ECONNABORTED") return i18n.t("errors.timeout");
  if (error?.request && !error.response) return i18n.t("errors.network");
  return fallback ?? i18n.t("errors.generic");
}
