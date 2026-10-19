import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ============================================================================
// PRODUCTION TOKEN REFRESH INTERCEPTOR WITH THUNDERING-HERD QUEUE PROTECTION
// ============================================================================

// Flag indicating whether a token refresh request is currently in-flight
let isRefreshing = false;

// Queue of pending requests that failed with 401 while refresh is in progress
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * Resolves or rejects all queued requests once the refresh request completes
 */
const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Response Interceptor:
 * Catches any 401 Unauthorized errors from protected endpoints,
 * automatically calls POST /auth/refresh-token, and replays the original request.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Ignore 401s from auth routes to avoid infinite recursion
    const requestUrl = originalRequest?.url || "";
    const isAuthRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh-token") ||
      requestUrl.includes("/auth/register");

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Another request is already refreshing the token; queue this request to replay after refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("[Auth Interceptor] 401 detected. Silently refreshing access token...");
        await api.post("/auth/refresh-token");
        console.log("[Auth Interceptor] Token refreshed successfully. Replaying failed request(s)...");

        // Broadcast token refresh event for any active listeners
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("token-refreshed"));
        }

        // Drain pending queue
        processQueue(null);

        // Replay original request
        return api(originalRequest);
      } catch (refreshError) {
        console.warn("[Auth Interceptor] Refresh token expired or invalid. Logging out session.", refreshError);
        processQueue(refreshError);

        // If refresh token also failed, session has truly expired
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_user_role");
          localStorage.removeItem("admin_profile_avatar");
          localStorage.removeItem("student_profile_avatar");
          window.dispatchEvent(new Event("auth-session-expired"));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;