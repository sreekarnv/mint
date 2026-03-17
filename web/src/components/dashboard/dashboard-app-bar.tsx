import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Box, Menu, MenuItem, ListItemIcon, Container, Chip, Divider } from "@mui/material";
import { AccountBalanceWallet, Logout, ExpandMore } from "@mui/icons-material";
import Avatar from "boring-avatars";
import { useGetAuthUserQuery, useLogoutUserMutation } from "../../store/api/auth";

export const DashboardAppBar: React.FC = () => {
  const { data: user } = useGetAuthUserQuery();
  const [logout] = useLogoutUserMutation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const avatarColors = ["#10b981", "#14b8a6", "#059669", "#0d9488", "#34d399"];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "white",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64, gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccountBalanceWallet sx={{ fontSize: 20, color: "white" }} />
            </Box>
            <Typography variant="h6" fontWeight="700" sx={{ color: "#064e3b", display: { xs: "none", sm: "block" } }}>
              Mint
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Chip
            avatar={
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Avatar size={32} name={user?.email || "User"} variant="beam" colors={avatarColors} />
              </Box>
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="body2" fontWeight="600" sx={{ display: { xs: "none", sm: "block" } }}>
                  {user?.firstName}
                </Typography>
                <ExpandMore sx={{ fontSize: 18 }} />
              </Box>
            }
            onClick={handleMenu}
            sx={{
              height: 40,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": {
                bgcolor: "rgba(16, 185, 129, 0.04)",
                borderColor: "primary.main",
              },
              cursor: "pointer",
              "& .MuiChip-avatar": {
                width: 32,
                height: 32,
                ml: 0.5,
              },
              "& .MuiChip-label": {
                px: 1.5,
              },
            }}
          />

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 220,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 2.5, py: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    overflow: "hidden",
                    bgcolor: "background.default",
                  }}
                >
                  <Avatar size={40} name={user?.email || "User"} variant="beam" colors={avatarColors} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight="600" noWrap>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Box sx={{ py: 1 }}>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  color: "error.main",
                  "&:hover": { bgcolor: "error.lighter" },
                }}
              >
                <ListItemIcon>
                  <Logout fontSize="small" sx={{ color: "error.main" }} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Box>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
