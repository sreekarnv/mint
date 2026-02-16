import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { ApiErrorResponse, ValidationErrorResponse } from "./store/errors";

export const AVATAR_COLORS = ["#10b981", "#14b8a6", "#059669", "#0d9488", "#34d399"];

export const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError => {
  return typeof error === "object" && error !== null && "status" in error;
};

export const getErrorMessage = (error: unknown): string | null => {
  if (!isFetchBaseQueryError(error)) {
    return null;
  }

  const data = error.data;

  if (typeof data === "object" && data !== null && "error" in data) {
    const nested = (data as { error: { message?: string; details?: { path: string; message: string }[] } }).error;
    if (nested?.details && Array.isArray(nested.details)) {
      return nested.details.map((d) => d.message).join(", ");
    }
    if (nested?.message) {
      return nested.message;
    }
  }

  if (Array.isArray(data)) {
    const messages = data
      .map((errResponse: ValidationErrorResponse) => errResponse.errors?.map((e) => e.message).join(", "))
      .filter(Boolean);
    return messages.join("; ") || "Invalid input";
  }

  if (typeof data === "object" && data !== null && "message" in data) {
    return (data as ApiErrorResponse).message;
  }

  if (typeof data === "string") {
    return data;
  }

  if (error.status === 400) {
    return "Invalid request. Please check your input.";
  }

  if (error.status === 401) {
    return "Unauthorized. Please login again.";
  }

  if (error.status === 403) {
    return "You don't have permission to perform this action.";
  }

  if (error.status === 404) {
    return "Resource not found.";
  }

  if (error.status === 500) {
    return "Server error. Please try again later.";
  }

  return "An error occurred. Please try again.";
};

export const getFullName = (firstName: string, lastName: string, middleName?: string) => {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.join(" ");
};
