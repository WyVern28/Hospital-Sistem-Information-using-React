import axios from "axios";
import { API_URL } from "../config/env";
import type { AuthSession } from "../types";

const SESSION_KEY = "anahita-session";
export const SESSION_EXPIRED_EVENT = "anahita:session-expired";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function loadSession(): AuthSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<AuthSession>;
    const role = parsed.user?.role;
    if (
      typeof parsed.token !== "string"
      || !parsed.token
      || typeof parsed.user?.id !== "number"
      || typeof parsed.user.name !== "string"
      || (role !== "PATIENT" && role !== "DOCTOR" && role !== "ADMIN")
    ) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed as AuthSession;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

api.interceptors.request.use((config) => {
  const token = loadSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && loadSession()) {
    clearSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  return Promise.reject(error);
});

export function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return typeof error.response?.data?.message === "string"
      ? error.response.data.message
      : error.code === "ECONNABORTED"
        ? "Server terlalu lama merespons. Silakan coba lagi."
        : "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.";
  }
  return "Terjadi kesalahan yang tidak diketahui.";
}
