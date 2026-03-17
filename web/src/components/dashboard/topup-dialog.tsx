import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import { AttachMoney } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTopupMutation } from "../../store/api/transactions";
import { topupFormSchema, type TopupFormData } from "../../schema/topup-form-schema";
import { getErrorMessage } from "../../utils";

interface TopupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const TopupDialog: React.FC<TopupDialogProps> = ({ open, onClose }) => {
  const [topup, { isLoading, error, isSuccess, reset: resetMutation }] = useTopupMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<TopupFormData>({
    resolver: zodResolver(topupFormSchema),
    mode: "onChange",
    defaultValues: {
      amount: undefined,
    },
  });

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  useEffect(() => {
    if (!open) {
      reset();
      resetMutation();
    }
  }, [open, reset, resetMutation]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        handleClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [isSuccess]);

  const onSubmit = async (data: TopupFormData) => {
    try {
      await topup({ amount: data.amount }).unwrap();
    } catch (err) {
      console.error("Topup failed:", err);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AttachMoney sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Top Up Wallet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Add funds to your wallet
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Top up successful! Your wallet has been updated.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(error)}
            </Alert>
          )}

          <Controller
            name="amount"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                autoFocus
                fullWidth
                label="Amount (USD)"
                type="number"
                value={value ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                  onChange(val);
                }}
                disabled={isLoading}
                error={!!errors.amount}
                helperText={errors.amount?.message || "Enter amount between $0.01 and $10,000"}
                inputProps={{
                  min: 0.01,
                  max: 10000,
                  step: 0.01,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      borderWidth: 2,
                    },
                  },
                }}
              />
            )}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={handleClose} disabled={isLoading} sx={{ px: 3 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !isValid}
            sx={{
              px: 3,
              background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
              },
              "&:disabled": {
                background: "rgba(16, 185, 129, 0.3)",
              },
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Top Up"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
