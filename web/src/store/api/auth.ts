import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { LoginInput, SignupInput } from "../../schema/auth.schema";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerifiedAt: Date | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  middleName?: string | undefined;
};

export const authApi = createApi({
  reducerPath: "authApi",
  tagTypes: ["auth.user"],
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1/auth" }),
  endpoints: (builder) => ({
    getAuthUser: builder.query<User, void>({
      query: () => "/user",
      providesTags: ["auth.user"],
    }),
    loginUser: builder.mutation<User, LoginInput>({
      query: (body) => ({ url: "/login", method: "POST", body }),
      invalidatesTags: ["auth.user"],
    }),
    signupUser: builder.mutation<User, SignupInput>({
      query: (body) => ({ url: "/signup", method: "POST", body }),
      invalidatesTags: ["auth.user"],
    }),
    logoutUser: builder.mutation<void, void>({
      query: () => ({ url: "/logout", method: "POST" }),
      invalidatesTags: ["auth.user"],
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useLazyGetAuthUserQuery,
  useLoginUserMutation,
  useLogoutUserMutation,
  useSignupUserMutation,
} = authApi;
