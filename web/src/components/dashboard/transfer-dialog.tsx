import React, { useState, useEffect, useCallback } from "react";
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
  Stack,
  Autocomplete,
  Box,
  Typography,
} from "@mui/material";
import { AttachMoney, Search, Send } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import BoringAvatar from "boring-avatars";
import { useTransferMutation } from "../../store/api/transactions";
import { useLazySearchUsersByEmailQuery } from "../../store/api/users";
import type { User } from "../../store/api/users";
import { transferFormSchema, type TransferFormData } from "../../schema/transfer-form.schema";
import { AVATAR_COLORS, getErrorMessage, getFullName } from "../../utils";

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
}

export const TransferDialog: React.FC<TransferDialogProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [transfer, { isLoading: transferLoading, error: transferError, isSuccess, reset: resetMutation }] =
    useTransferMutation();
  const [searchUsers, { data: usersData, isLoading: searchLoading, error: searchError }] = useLazySearchUsersByEmailQuery();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    mode: "onChange",
    defaultValues: {
      toUserId: "",
      amount: undefined,
    },
  });

  const handleUserSelect = (user: User | null) => {
    setSelectedUser(user);
    setValue("toUserId", user?.id || "", { shouldValidate: true });
  };

  const handleClose = useCallback(() => {
    if (!transferLoading) {
      reset();
      resetMutation();
      setSelectedUser(null);
      setSearchQuery("");
      onClose();
    }
  }, [transferLoading, reset, resetMutation, onClose]);

  const onSubmit = async (data: TransferFormData) => {
    try {
      await transfer({
        toUserId: data.toUserId,
        amount: data.amount,
      }).unwrap();
    } catch (err) {
      console.error("Transfer failed:", err);
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchUsers]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        handleClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [isSuccess]);

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
              <Send sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Transfer Money
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Send money to another user
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Transfer successful! Money has been sent.
            </Alert>
          )}

          {transferError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(transferError) || "Transfer failed. Please try again."}
            </Alert>
          )}

          {searchError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(searchError) || "Search failed. Please try again."}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Autocomplete
              value={selectedUser}
              onChange={(_event, newValue) => handleUserSelect(newValue)}
              inputValue={searchQuery}
              onInputChange={(_event, newInputValue) => setSearchQuery(newInputValue)}
              options={usersData || []}
              getOptionLabel={(option) => getFullName(option.firstName, option.lastName, option.middleName)}
              loading={searchLoading}
              disabled={transferLoading}
              noOptionsText={
                searchQuery.length < 2
                  ? "Type at least 2 characters to search..."
                  : searchLoading
                    ? "Searching..."
                    : "No users found"
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Recipient by Email"
                  placeholder="Type email address..."
                  required
                  error={!!errors.toUserId}
                  helperText={errors.toUserId?.message || "Search by email address (min 2 characters)"}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
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
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "background.default",
                      flexShrink: 0,
                    }}
                  >
                    <BoringAvatar size={40} name={option.email} variant="beam" colors={AVATAR_COLORS} />
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight="600" noWrap>
                      {getFullName(option.firstName, option.lastName, option.middleName)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {selectedUser && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "white",
                    flexShrink: 0,
                  }}
                >
                  <BoringAvatar size={48} name={selectedUser.email} variant="beam" colors={AVATAR_COLORS} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight="600" color="text.secondary">
                    Transferring to:
                  </Typography>
                  <Typography variant="body1" fontWeight="700" color="primary" noWrap>
                    {getFullName(selectedUser.firstName, selectedUser.lastName, selectedUser.middleName)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>
            )}

            <Controller
              name="amount"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <TextField
                  {...field}
                  label="Amount (USD)"
                  type="number"
                  fullWidth
                  value={value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    onChange(val);
                  }}
                  disabled={transferLoading}
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
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={handleClose} disabled={transferLoading} sx={{ px: 3 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={transferLoading || !isValid}
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
            {transferLoading ? <CircularProgress size={24} color="inherit" /> : "Transfer"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
