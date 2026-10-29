import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { SxProps, Theme } from "@mui/material/styles";
import { tokens } from "../../theme";

// The one card style used everywhere. `muted` is for settings / secondary info
// so it reads as different from measured metrics.
export const SurfaceCard: React.FC<{
  children: React.ReactNode;
  muted?: boolean;
  sx?: SxProps<Theme>;
  component?: React.ElementType;
  "aria-label"?: string;
}> = ({ children, muted = false, sx, component = "section", ...rest }) => (
  <Box
    component={component}
    {...rest}
    sx={[
      {
        backgroundColor: muted ? "transparent" : tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderStyle: muted ? "dashed" : "solid",
        borderRadius: 3,
        p: { xs: 2, sm: 2.5 },
        minWidth: 0,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Box>
);

// Keyboard-reachable info tooltip (focusable button with an aria-label).
export const InfoTip: React.FC<{ title: React.ReactNode; label: string }> = ({
  title,
  label,
}) => (
  <Tooltip title={title} arrow enterTouchDelay={0} leaveTouchDelay={6000}>
    <IconButton
      size="small"
      aria-label={label}
      sx={{ color: tokens.textMuted, p: 0.25, ml: 0.25 }}
    >
      <InfoOutlinedIcon sx={{ fontSize: 16 }} />
    </IconButton>
  </Tooltip>
);

export const Overline: React.FC<{
  children: React.ReactNode;
  info?: React.ReactNode;
  infoLabel?: string;
}> = ({ children, info, infoLabel }) => (
  <Box sx={{ display: "flex", alignItems: "center", minHeight: 24 }}>
    <Typography
      variant="overline"
      component="h3"
      sx={{ color: tokens.textMuted, fontSize: 12 }}
    >
      {children}
    </Typography>
    {info && <InfoTip title={info} label={infoLabel || `About ${children}`} />}
  </Box>
);

export const EmptyState: React.FC<{
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <SurfaceCard
    sx={{
      textAlign: "center",
      py: { xs: 5, sm: 6 },
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 1,
    }}
  >
    {icon && <Box sx={{ color: tokens.accentSoft, mb: 1 }}>{icon}</Box>}
    <Typography variant="h6">{title}</Typography>
    {description && (
      <Typography
        variant="body2"
        sx={{ color: tokens.textSecondary, maxWidth: 520 }}
      >
        {description}
      </Typography>
    )}
    {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
  </SurfaceCard>
);
