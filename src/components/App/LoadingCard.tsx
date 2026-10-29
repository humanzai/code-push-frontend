import React from "react";
import { CircularProgress, Typography } from "@mui/material";
import { SurfaceCard } from "../common/ui";
import { tokens } from "../../theme";

const LoadingCard: React.FC = () => (
  <SurfaceCard
    aria-busy="true"
    sx={{
      maxWidth: 600,
      mx: "auto",
      py: 5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    }}
  >
    <CircularProgress size={28} aria-label="Loading apps" />
    <Typography sx={{ color: tokens.textSecondary }}>Loading apps…</Typography>
  </SurfaceCard>
);

export default LoadingCard;
