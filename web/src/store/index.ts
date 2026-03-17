import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApi } from "./api/auth";
import { walletApi } from "./api/wallet";
import { transactionsApi } from "./api/transactions";
import { usersApi } from "./api/users";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [walletApi.reducerPath]: walletApi.reducer,
    [transactionsApi.reducerPath]: transactionsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, walletApi.middleware, transactionsApi.middleware, usersApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
