import { createTheme, alpha } from "@mui/material/styles";

// One place for the colors used across the app (dark purple identity).
export const tokens = {
  bg: "#1e1e2f",
  surface: "#2c2c3e",
  surfaceRaised: "#34344a",
  border: "#3d3d55",
  accent: "#7c4dff",
  accentHover: "#9575cd",
  accentSoft: "#b39ddb",
  textPrimary: "#ffffff",
  textSecondary: "#c9c6dd",
  textMuted: "#9e9cb8",
  success: "#81c784",
  warning: "#ffb74d",
  error: "#ff6f61",
  info: "#4fc3f7",
};

// Soft chip / badge style: tinted background, colored text (keeps contrast).
export const softChip = (color: string) => ({
  backgroundColor: alpha(color, 0.16),
  color,
  fontWeight: 700,
  height: 22,
  fontSize: 12,
  "& .MuiChip-label": { px: 1 },
});

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: tokens.accent, contrastText: "#ffffff" },
    secondary: { main: tokens.accentSoft },
    error: { main: tokens.error },
    warning: { main: tokens.warning },
    success: { main: tokens.success },
    info: { main: tokens.info },
    background: { default: tokens.bg, paper: tokens.surface },
    divider: tokens.border,
    text: {
      primary: tokens.textPrimary,
      secondary: tokens.textSecondary,
      disabled: tokens.textMuted,
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "Nunito, Arial, sans-serif",
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
    overline: {
      fontWeight: 700,
      letterSpacing: "0.08em",
      lineHeight: 1.6,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.bg },
        "code, .mono": {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          "&:hover": { backgroundColor: tokens.accentHover },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#11111c",
          border: `1px solid ${tokens.border}`,
          fontSize: 13,
          lineHeight: 1.45,
          padding: "8px 10px",
          maxWidth: 320,
        },
        arrow: { color: "#11111c" },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 700, minHeight: 44 },
      },
    },
  },
});
