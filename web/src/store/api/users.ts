import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type User = {
  id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SearchUsersResponse = User[];

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/v1/users",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    searchUsersByEmail: builder.query<SearchUsersResponse, string>({
      query: (email) => `/search?email=${encodeURIComponent(email)}`,
    }),
    getAllUsers: builder.query<SearchUsersResponse, void>({
      query: () => "/",
    }),
    getPublicUserProfile: builder.query<User, string>({
      query: (id) => `/${id}`,
    }),
  }),
});

export const {
  useSearchUsersByEmailQuery,
  useLazySearchUsersByEmailQuery,
  useGetAllUsersQuery,
  useGetPublicUserProfileQuery,
} = usersApi;
