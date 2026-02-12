import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { Outlet, useNavigate } from "react-router";
import { AccountBalanceWallet } from "@mui/icons-material";
import AuthIllustration from "../components/auth/auth-illustration";
import { AuthProvider, type AuthLayoutData } from "../providers/auth.provider";
import { useGetAuthUserQuery } from "../store/api/auth";

export const AuthLayout: React.FC = () => {
  const navigate = useNavigate();
  const { data: user, isLoading, isSuccess } = useGetAuthUserQuery();

  const [layoutData, setLayoutData] = useState<AuthLayoutData>({
    title: "Welcome to Mint",
    subtitle: "Manage your finances with confidence",
    illustrationSrc: "/login.svg",
  });

  const handleDataChange = useCallback((data: AuthLayoutData) => {
    setLayoutData(data);
  }, []);

  useEffect(() => {
    if (isSuccess && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isSuccess, user, navigate]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              p: 2,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
              mb: 3,
            }}
          >
            <AccountBalanceWallet sx={{ fontSize: 48, color: "white" }} />
          </Box>
          <CircularProgress
            sx={{
              color: "primary.main",
            }}
          />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isSuccess && !user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          background: "#f9fafb",
        }}
      >
        <Box
          sx={{
            flex: 1,
            background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
            p: { xs: 4, md: 6, lg: 8 },
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: "-80px",
              left: "-80px",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)",
            }}
          />

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              maxWidth: "600px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{
                mb: 2,
                lineHeight: 1.2,
                fontSize: { md: "2.5rem", lg: "3rem" },
                color: "white",
              }}
            >
              {layoutData.title}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                mb: 6,
                opacity: 0.95,
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: "500px",
                color: "white",
              }}
            >
              {layoutData.subtitle}
            </Typography>

            <Box
              sx={{
                width: "100%",
                maxWidth: "500px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AuthIllustration src={layoutData.illustrationSrc} />
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 3, sm: 4, md: 6 },
            background: "white",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: "480px" }}>
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                justifyContent: "center",
                mb: 4,
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  p: 2,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
                }}
              >
                <AccountBalanceWallet sx={{ fontSize: 32, color: "white" }} />
              </Box>
            </Box>

            <AuthProvider onDataChange={handleDataChange}>
              <Outlet />
            </AuthProvider>
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
};
