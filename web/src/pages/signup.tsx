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
  Stack,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "../schema/auth.schema";
import { useSignupUserMutation } from "../store/api/auth";
import { useAuthProvider } from "../providers/auth.provider";

export const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const navigate = useNavigate();
  const { setLayoutData } = useAuthProvider();

  const [signupUser, { isLoading, isSuccess, error, isError }] = useSignupUserMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  // Set layout data when component mounts
  useEffect(() => {
    setLayoutData({
      title: "Manage your money with confidence",
      subtitle: "Join thousands of users who trust Mint for secure and reliable wallet management",
      illustrationSrc: "/signup.svg",
    });
  }, [setLayoutData]);

  useEffect(() => {
    if (isSuccess) {
      navigate("/login", {
        state: { message: "Account created successfully! Please sign in." },
      });
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (data: SignupInput) => {
    try {
      await signupUser(data).unwrap();
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  const getErrorMessage = () => {
    if (isError && error) {
      if ("status" in error) {
        if (error.status === 409) {
          return "An account with this email already exists";
        }
        if (typeof error.data === "object" && error.data && "message" in error.data) {
          return (error.data as { message: string }).message;
        }
        return "Signup failed. Please try again.";
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
          Create your account
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Fill in your details to get started
        </Typography>
      </Box>

      {getErrorMessage() && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {getErrorMessage()}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          {/* Name Fields Row */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="First Name"
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  disabled={isLoading}
                />
              )}
            />

            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Last Name"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  disabled={isLoading}
                />
              )}
            />
          </Box>

          <Controller
            name="middleName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Middle Name (Optional)"
                error={!!errors.middleName}
                helperText={errors.middleName?.message}
                disabled={isLoading}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email Address"
                type="email"
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isLoading}
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
                autoComplete="new-password"
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

          <Controller
            name="passwordConfirm"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Confirm Password"
                type={showPasswordConfirm ? "text" : "password"}
                autoComplete="new-password"
                error={!!errors.passwordConfirm}
                helperText={errors.passwordConfirm?.message}
                disabled={isLoading}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          edge="end"
                          disabled={isLoading}
                        >
                          {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
        </Stack>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{
            mt: 4,
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
          {isLoading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
        </Button>

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <MuiLink
              component={RouterLink}
              to="/login"
              underline="hover"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                "&:hover": {
                  color: "primary.dark",
                },
              }}
            >
              Sign in
            </MuiLink>
          </Typography>
        </Box>
      </form>
    </>
  );
};

export default SignupPage;
