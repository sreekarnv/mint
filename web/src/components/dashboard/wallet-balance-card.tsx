import React from "react";
import { Card, CardContent, Typography, Box, Chip, Skeleton } from "@mui/material";
import { AccountBalanceWallet, TrendingUp } from "@mui/icons-material";

interface WalletBalanceCardProps {
  wallet?: {
    id: string;
    userId: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
  };
  isLoading?: boolean;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({ wallet, isLoading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <Card
        sx={{
          background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
          color: "white",
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          minHeight: 240,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width={120} height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
          <Skeleton variant="text" width={200} height={64} sx={{ bgcolor: "rgba(255,255,255,0.2)", mt: 3 }} />
          <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
            <Skeleton variant="text" width={100} height={24} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
            <Skeleton variant="text" width={100} height={24} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
        color: "white",
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 24px rgba(16, 185, 129, 0.3)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
        }}
      />

      <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccountBalanceWallet sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="body2" fontWeight="600" sx={{ opacity: 0.9 }}>
              Total Balance
            </Typography>
          </Box>
          <Chip
            icon={<TrendingUp sx={{ fontSize: 16, color: "white !important" }} />}
            label="Active"
            size="small"
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              fontWeight: 600,
              "& .MuiChip-icon": {
                color: "white",
              },
            }}
          />
        </Box>

        <Typography
          variant="h3"
          fontWeight="700"
          sx={{
            mb: 4,
            fontSize: { xs: "2.5rem", sm: "3rem" },
            letterSpacing: "-1px",
          }}
        >
          {formatCurrency(wallet?.balance || 0)}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block" }}>
              Account ID
            </Typography>
            <Typography variant="body2" fontWeight="600" sx={{ fontFamily: "monospace" }}>
              {wallet?.id.substring(0, 8).toUpperCase()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block" }}>
              Last Updated
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {wallet?.updatedAt ? formatDate(wallet.updatedAt) : "-"}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
