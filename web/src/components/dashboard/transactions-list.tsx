import React, { useState } from "react";
import { Card, CardContent, Typography, Box, Tabs, Tab, CircularProgress, Button, Alert } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useGetTransactionsQuery, TransactionType } from "../../store/api/transactions";
import { useGetAuthUserQuery } from "../../store/api/auth";
import { TransactionItem } from "./transaction-item";

type TabValue = "all" | "TopUp" | "Transfer";

export const TransactionsList: React.FC = () => {
  const { data: user } = useGetAuthUserQuery();
  const [typeFilter, setTypeFilter] = useState<TabValue>("all");
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const { data, isLoading, isFetching, error, refetch } = useGetTransactionsQuery({
    limit,
    offset,
    ...(typeFilter !== "all" && { type: typeFilter as TransactionType }),
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setTypeFilter(newValue);
    setOffset(0);
  };

  const hasMore = data ? offset + limit < data.total : false;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            Recent Transactions
          </Typography>
          <Button size="small" startIcon={<Refresh />} onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </Box>

        <Tabs value={typeFilter} onChange={handleTabChange} sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
          <Tab label="All" value="all" />
          <Tab label="Top Up" value="TopUp" />
          <Tab label="Transfer" value="Transfer" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load transactions. Please try again.
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : data?.transactions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">No transactions found</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {data?.transactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} currentUserId={user?.id ?? ""} />
                ))}
              </Box>

              {data && totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    disabled={offset === 0}
                    onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                  >
                    Previous
                  </Button>
                  <Typography sx={{ display: "flex", alignItems: "center", px: 2 }}>
                    Page {currentPage} of {totalPages}
                  </Typography>
                  <Button variant="outlined" disabled={!hasMore} onClick={() => setOffset((prev) => prev + limit)}>
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
