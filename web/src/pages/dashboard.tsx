import React from "react";
import { Box, Container, Typography, Alert, Fade, Skeleton } from "@mui/material";
import { useGetAuthUserQuery } from "../store/api/auth";
import { useGetUserWalletQuery } from "../store/api/wallet";
import { WalletBalanceCard } from "../components/dashboard/wallet-balance-card";
import { QuickActions } from "../components/dashboard/quick-actions";
import { StatsCards } from "../components/dashboard/stats-card";
import { TransactionsList } from "../components/dashboard/transactions-list";
import { DashboardAppBar } from "../components/dashboard/dashboard-app-bar";

const DashboardPage: React.FC = () => {
  const { data: user, isLoading: userLoading } = useGetAuthUserQuery();
  const { data: wallet, isLoading: walletLoading, error: walletError } = useGetUserWalletQuery();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f9fafb" }}>
      <DashboardAppBar />

      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            {userLoading ? (
              <>
                <Skeleton variant="text" width={300} height={48} />
                <Skeleton variant="text" width={250} height={28} />
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  fontWeight="700"
                  gutterBottom
                  sx={{
                    color: "text.primary",
                    fontSize: { xs: "1.75rem", sm: "2.125rem" },
                  }}
                >
                  {getGreeting()}, {user?.firstName}!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                  Manage your wallet and track your transactions
                </Typography>
              </>
            )}
          </Box>
        </Fade>

        {walletError && (
          <Fade in>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                "& .MuiAlert-icon": {
                  alignItems: "center",
                },
              }}
            >
              Failed to load wallet information. Please refresh the page or try again later.
            </Alert>
          </Fade>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Fade in timeout={600}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                gap: { xs: 2, sm: 3 },
              }}
            >
              <WalletBalanceCard wallet={wallet} isLoading={walletLoading} />
              <QuickActions />
            </Box>
          </Fade>

          <Fade in timeout={700}>
            <Box>
              <StatsCards />
            </Box>
          </Fade>

          <Fade in timeout={800}>
            <Box>
              <TransactionsList />
            </Box>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;
