"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth.store";

export function useUser() {
  const { user, hydrated, setUser, clearUser, setHydrated } = useAuthStore();

  const { data, isSuccess, isError } = useQuery({
    queryKey: ["user"],
    queryFn: authApi.me,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (isSuccess && data) {
      setUser(data);
      setHydrated();
    }
  }, [isSuccess, data, setUser, setHydrated]);

  useEffect(() => {
    if (isError) {
      clearUser();
      setHydrated();
    }
  }, [isError, clearUser, setHydrated]);

  return { user, hydrated };
}
