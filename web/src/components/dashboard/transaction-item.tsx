import React from "react";
import { Box, Typography, Chip, Paper } from "@mui/material";
import { TrendingUp, Schedule, CheckCircle, Cancel, CallReceived, CallMade } from "@mui/icons-material";
import type { Transaction } from "../../store/api/transactions";
import { TransactionType, TransactionStatus } from "../../store/api/transactions";

interface TransactionItemProps {
  transaction: Transaction;
  currentUserId: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, currentUserId }) => {
  const isTopup = transaction.type === TransactionType.Topup;
  const isCompleted = transaction.status === TransactionStatus.Completed;
  const isPending = transaction.status === TransactionStatus.Pending;
  const isFailed = transaction.status === TransactionStatus.Failed;

  const isReceivedTransfer =
    !isTopup && transaction.type === TransactionType.Transfer && transaction.toUserId === currentUserId;

  const isPositive = isTopup || isReceivedTransfer;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusChip = () => {
    if (isCompleted) {
      return (
        <Chip
          icon={<CheckCircle sx={{ fontSize: 16 }} />}
          label="Completed"
          size="small"
          color="success"
          sx={{ height: 24 }}
        />
      );
    }
    if (isPending) {
      return (
        <Chip icon={<Schedule sx={{ fontSize: 16 }} />} label="Pending" size="small" color="warning" sx={{ height: 24 }} />
      );
    }
    if (isFailed) {
      return <Chip icon={<Cancel sx={{ fontSize: 16 }} />} label="Failed" size="small" color="error" sx={{ height: 24 }} />;
    }
  };

  const getIcon = () => {
    if (isTopup) return <TrendingUp sx={{ fontSize: 28 }} />;
    if (isReceivedTransfer) return <CallReceived sx={{ fontSize: 28 }} />;
    return <CallMade sx={{ fontSize: 28 }} />;
  };

  const getLabel = () => {
    if (isTopup) return "Top Up";
    if (isReceivedTransfer) return "Money Received";
    return "Money Sent";
  };

  const color = isPositive ? "#10b981" : "#ef4444";
  const bgColor = isPositive ? "#d1fae5" : "#fee2e2";

  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 2,
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bgColor,
          color: color,
        }}
      >
        {getIcon()}
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body1" fontWeight="600" gutterBottom>
          {getLabel()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDate(transaction.createdAt)}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "right" }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: color, mb: 0.5 }}>
          {isPositive ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </Typography>
        {getStatusChip()}
      </Box>
    </Paper>
  );
};
