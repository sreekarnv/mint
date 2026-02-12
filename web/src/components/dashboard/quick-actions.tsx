import React, { useState } from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import { Add, Send } from "@mui/icons-material";
import { TopupDialog } from "./topup-dialog";
import { TransferDialog } from "./transfer-dialog";

export const QuickActions: React.FC = () => {
  const [topupOpen, setTopupOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          height: "100%",
          transition: "box-shadow 0.2s",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
        }}
      >
        <CardContent sx={{ p: 3, height: "100%" }}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="700" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your wallet
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: "auto" }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                fullWidth
                onClick={() => setTopupOpen(true)}
                sx={{
                  py: 1.5,
                  background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1rem",
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                  },
                }}
              >
                Top Up
              </Button>
              <Button
                variant="outlined"
                startIcon={<Send />}
                fullWidth
                onClick={() => setTransferOpen(true)}
                sx={{
                  py: 1.5,
                  borderColor: "primary.main",
                  color: "primary.main",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1rem",
                  borderRadius: 2,
                  borderWidth: 2,
                  "&:hover": {
                    borderColor: "primary.dark",
                    borderWidth: 2,
                    bgcolor: "rgba(16, 185, 129, 0.04)",
                  },
                }}
              >
                Transfer
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TopupDialog open={topupOpen} onClose={() => setTopupOpen(false)} />
      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />
    </>
  );
};
