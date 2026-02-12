import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../schema/auth.schema";
import { useLoginUserMutation } from "../store/api/auth";
import { useAuthProvider } from "../providers/auth.provider";

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setLayoutData } = useAuthProvider();

  const [loginUser, { isLoading, isSuccess, error, isError }] = useLoginUserMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Set layout data when component mounts
  useEffect(() => {
    setLayoutData({
      title: "Welcome back to Mint",
      subtitle: "Access your wallet and manage your finances securely",
      illustrationSrc: "/login.svg",
    });
  }, [setLayoutData]);

  useEffect(() => {
    if (isSuccess) {
      navigate("/dashboard");
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (data: LoginInput) => {
    try {
      await loginUser(data).unwrap();
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const getErrorMessage = () => {
    if (isError && error) {
      if ("status" in error) {
        if (error.status === 401) {
          return "Invalid email or password";
        }
        if (typeof error.data === "object" && error.data && "message" in error.data) {
          return (error.data as { message: string }).message;
        }
        return "Login failed. Please try again.";
      } else if ("message" in error) {
        return error.message || "An error occurred";
      }
    }
    return null;
  };

  return (
    <>
      {/* Form Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: "#064e3b" }}>
          Sign in to your account
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Enter your credentials to continue
        </Typography>
      </Box>

      {getErrorMessage() && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {getErrorMessage()}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={isLoading}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={isLoading}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{
            mt: 3,
            mb: 2,
            py: 1.5,
            fontSize: "1rem",
            fontWeight: 600,
            background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
              boxShadow: "0 6px 20px rgba(16, 185, 129, 0.5)",
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "rgba(16, 185, 129, 0.5)",
            },
            transition: "all 0.3s ease",
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
        </Button>

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <MuiLink
              component={RouterLink}
              to="/signup"
              underline="hover"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                "&:hover": {
                  color: "primary.dark",
                },
              }}
            >
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </form>
    </>
  );
};

export default LoginPage;
