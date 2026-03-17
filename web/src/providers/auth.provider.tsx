import React, { createContext, useContext, useCallback } from "react";

interface AuthProviderContextValue {
  setLayoutData: (data: AuthLayoutData) => void;
}

export interface AuthLayoutData {
  title: string;
  subtitle: string;
  illustrationSrc: string;
}

const AuthProviderContext = createContext<AuthProviderContextValue | undefined>(undefined);

export const useAuthProvider = () => {
  const context = useContext(AuthProviderContext);
  if (!context) {
    throw new Error("useAuthProvider must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onDataChange: (data: AuthLayoutData) => void;
}> = ({ children, onDataChange }) => {
  const setLayoutData = useCallback(
    (data: AuthLayoutData) => {
      onDataChange(data);
    },
    [onDataChange],
  );

  return <AuthProviderContext.Provider value={{ setLayoutData }}>{children}</AuthProviderContext.Provider>;
};
