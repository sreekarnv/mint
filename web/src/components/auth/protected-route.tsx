import React from "react";
import { Navigate } from "react-router";
import { Box, CircularProgress } from "@mui/material";
import { useGetAuthUserQuery } from "../../store/api/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { data: user, isLoading, error } = useGetAuthUserQuery();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "#f9fafb",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress
            size={48}
            sx={{
              color: "#10b981",
            }}
          />
        </Box>
      </Box>
    );
  }

  if (!user || error) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
