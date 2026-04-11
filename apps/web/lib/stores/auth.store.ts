import { create } from "zustand";
import type { User } from "@/lib/api/auth";

interface AuthStore {
  user: User | null;
  hydrated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setHydrated: () => set({ hydrated: true }),
}));
