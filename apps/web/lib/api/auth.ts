import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  email_verified: boolean;
}

export interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post("/api/v1/auth/register", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post("/api/v1/auth/login", data),

  logout: () => apiClient.post("/api/v1/auth/logout"),

  me: () => apiClient.get<User>("/api/v1/auth/me"),

  verifyEmail: (token: string) =>
    apiClient.post("/api/v1/auth/verify-email", { token }),

  forgotPassword: (email: string) =>
    apiClient.post("/api/v1/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post("/api/v1/auth/reset-password", data),

  resendVerification: () =>
    apiClient.post("/api/v1/auth/request-verify-email"),

  searchUsers: (email: string) =>
    apiClient.get<UserSearchResult[]>(`/api/v1/auth/users/search?email=${encodeURIComponent(email)}`),
};
