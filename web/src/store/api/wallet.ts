import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type Wallet = {
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  id: string;
};

export const walletApi = createApi({
  reducerPath: "walletApi",
  tagTypes: ["wallet.user"],
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1/wallet", credentials: "include" }),
  endpoints: (builder) => ({
    getUserWallet: builder.query<Wallet, void>({
      query: () => "/user",
      providesTags: ["wallet.user"],
    }),
  }),
});

export const { useGetUserWalletQuery, useLazyGetUserWalletQuery } = walletApi;
