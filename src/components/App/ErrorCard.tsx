import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { SurfaceCard } from "../common/ui";
import { tokens } from "../../theme";

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({
  title = "Error",
  message,
  onRetry,
}) => (
  <SurfaceCard
    sx={{
      maxWidth: 600,
      mx: "auto",
      textAlign: "center",
      py: 5,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 1.5,
    }}
  >
    <ErrorOutlineIcon sx={{ fontSize: 40, color: tokens.error }} />
    <Typography variant="h6" component="h1" sx={{ color: tokens.error }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: tokens.textSecondary }} role="alert">
      {message}
    </Typography>
    {onRetry && (
      <Box sx={{ mt: 1 }}>
        <Button variant="contained" onClick={onRetry}>
          Try again
        </Button>
      </Box>
    )}
  </SurfaceCard>
);

export default ErrorCard;
