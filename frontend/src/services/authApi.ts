/**
 * ============================================================================
 * SERVICE: Authentication API
 * DESCRIPTION:
 * Encapsulates all authentication network operations against the backend API,
 * including login, registration, email verification, password reset, and logout.
 * ============================================================================
 */

import api from "./api";

/**
 * Authenticates user credentials and returns session tokens and user payload.
 */
export const login = async (data: { email: string; password: string }) => {
  const response = await api.post("/auth/login", data);

  return {
    ...response.data,
    ...(response.data?.data && typeof response.data.data === "object"
      ? response.data.data
      : {}),
    data: response.data?.data || response.data,
    status: response.status,
  };
};

/**
 * Registers a new student account.
 */
export const signup = async (data: {
  FullName: string;
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/register", data);

  return {
    ...response.data,
    status: response.status,
  };
};

/**
 * Verifies email address using the one-time token from verification link.
 */
export const verifyEmail = async (token: string) => {
  const response = await api.get(
    `/auth/verify-email?token=${encodeURIComponent(token)}`
  );

  return {
    ...response.data,
    status: response.status,
  };
};

/**
 * Triggers a new email verification link to be sent to the user's inbox.
 */
export const resendVerificationEmail = async (email: string) => {
  const response = await api.post("/auth/resend-verification-email", { email });

  return {
    ...response.data,
    status: response.status,
  };
};

/**
 * Initiates forgot password flow by requesting a reset email.
 */
export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

/**
 * Resets user password using the verification token and new password.
 */
export const resetPassword = async (token: string, password: string) => {
  const response = await api.post(
    `/auth/reset-password?token=${encodeURIComponent(token)}`,
    { password }
  );
  return response.data;
};

/**
 * Terminates user session on backend and clears authentication cookies.
 */
export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};
