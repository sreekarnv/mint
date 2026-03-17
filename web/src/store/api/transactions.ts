import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { walletApi } from "./wallet";

export type TopupInput = {
  amount: number;
};

export enum TransactionType {
  Transfer = "Transfer",
  Topup = "TopUp",
}

export enum TransactionStatus {
  Pending = "Pending",
  Processing = "Processing",
  Completed = "Completed",
  Failed = "Failed",
}

export type TransferInput = {
  amount: number;
  toUserId: string;
};

export type BaseTransaction = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TopupTransaction = BaseTransaction & {
  type: TransactionType.Topup;
  userId: string;
};

export type TransferTransaction = BaseTransaction & {
  type: TransactionType.Transfer;
  fromUserId: string;
  toUserId: string;
};

export type Transaction = TopupTransaction | TransferTransaction;

export type GetTransactionsParams = {
  limit?: number;
  offset?: number;
  type?: "TopUp" | "Transfer";
};

export type GetTransactionsResponse = {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
};

export const transactionsApi = createApi({
  reducerPath: "txnsApi",
  tagTypes: ["transactions"],
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/v1/transactions",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getTransactions: builder.query<GetTransactionsResponse, GetTransactionsParams | void>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.append("limit", params.limit.toString());
        if (params?.offset) searchParams.append("offset", params.offset.toString());
        if (params?.type) searchParams.append("type", params.type);
        return `/?${searchParams.toString()}`;
      },
      providesTags: ["transactions"],
    }),
    topup: builder.mutation<TopupTransaction, TopupInput>({
      query: (body) => ({ url: "/topup", method: "POST", body }),
      invalidatesTags: ["transactions"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(walletApi.util.invalidateTags(["wallet.user"]));
      },
    }),
    transfer: builder.mutation<TransferTransaction, TransferInput>({
      query: (body) => ({ url: "/transfer", method: "POST", body }),
      invalidatesTags: ["transactions"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(walletApi.util.invalidateTags(["wallet.user"]));
      },
    }),
  }),
});

export const { useGetTransactionsQuery, useLazyGetTransactionsQuery, useTopupMutation, useTransferMutation } =
  transactionsApi;
