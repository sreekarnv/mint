import React from "react";
import { Box, Card, CardContent, Typography, Skeleton } from "@mui/material";
import { TrendingDown, TrendingUp, Receipt, Schedule } from "@mui/icons-material";
import { useGetTransactionsQuery } from "../../store/api/transactions";

export const StatsCards: React.FC = () => {
  const { data: transactionsData, isLoading } = useGetTransactionsQuery({ limit: 100, offset: 0 });

  const stats = React.useMemo(() => {
    if (!transactionsData?.transactions) {
      return { sent: 0, received: 0, total: 0, pending: 0 };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let sent = 0;
    let received = 0;
    let pending = 0;

    transactionsData.transactions.forEach((txn) => {
      const txnDate = new Date(txn.createdAt);
      const isCurrentMonth = txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;

      if (txn.status === "Pending") {
        pending++;
      }

      if (isCurrentMonth) {
        if (txn.type === "Transfer") {
          sent += txn.amount;
        } else if (txn.type === "TopUp") {
          received += txn.amount;
        }
      }
    });

    return {
      sent,
      received,
      total: transactionsData.total,
      pending,
    };
  }, [transactionsData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const statItems = [
    {
      title: "Sent This Month",
      value: formatCurrency(stats.sent),
      icon: <TrendingDown />,
      color: "#fee2e2",
      iconColor: "#ef4444",
    },
    {
      title: "Received This Month",
      value: formatCurrency(stats.received),
      icon: <TrendingUp />,
      color: "#d1fae5",
      iconColor: "#10b981",
    },
    {
      title: "Total Transactions",
      value: stats.total.toString(),
      icon: <Receipt />,
      color: "#dbeafe",
      iconColor: "#3b82f6",
    },
    {
      title: "Pending",
      value: stats.pending.toString(),
      icon: <Schedule />,
      color: "#fef3c7",
      iconColor: "#f59e0b",
    },
  ];

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Skeleton variant="text" width={100} height={20} />
              <Skeleton variant="text" width={80} height={40} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
        gap: 2,
        mb: 3,
      }}
    >
      {statItems.map((stat, index) => (
        <Card
          key={index}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            transition: "all 0.2s",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
            },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                {stat.title}
              </Typography>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  bgcolor: stat.color,
                  color: stat.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {stat.icon}
              </Box>
            </Box>
            <Typography variant="h5" fontWeight="700" color="text.primary">
              {stat.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
