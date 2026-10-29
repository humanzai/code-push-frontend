import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";
import AppsIcon from "@mui/icons-material/Apps";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { toast } from "react-toastify";
import { getApps } from "../../api/api";
import DeploymentTable from "../DeploymentTable/DeploymentTable";
import { EmptyState } from "../common/ui";
import ErrorCard from "./ErrorCard";
import LoadingCard from "./LoadingCard";
import { theme, tokens } from "../../theme";

interface AppType {
  name: string;
  deployments?: string[];
}

const SIDEBAR_WIDTH = 240;

// Shown in the sidebar so it's obvious which CodePush server (dev / prod) this is.
const serverHost = (() => {
  try {
    const url = window.SERVER_CONF?.BACKEND_URL;
    return url ? new URL(url).host : "";
  } catch {
    return "";
  }
})();

const App: React.FC = () => {
  const [apps, setApps] = useState<AppType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const loadApps = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getApps()
      .then((response) => {
        if (response?.apps) {
          setApps(response.apps);
        } else {
          setLoadError("No apps found in the response");
        }
      })
      .catch((error) => {
        const message = error?.message || "Apps can't be loaded";
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadApps, [loadApps]);

  // Open the first app by default.
  useEffect(() => {
    if (apps.length > 0 && location === "/") {
      setLocation(`/${encodeURIComponent(apps[0].name)}`, { replace: true });
    }
  }, [apps, location, setLocation]);

  const match = location.match(/^\/([^/]+)/);
  const selectedName = match ? decodeURIComponent(match[1]) : null;
  const selectedApp = apps.find((a) => a.name === selectedName) || null;

  const sidebar = (
    <Box
      component="nav"
      aria-label="Apps"
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: tokens.surface,
        borderRight: `1px solid ${tokens.border}`,
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <Typography variant="h6" component="p" sx={{ fontWeight: 800 }}>
          CodePush
        </Typography>
        <Typography variant="caption" sx={{ color: tokens.textMuted }}>
          OTA releases
        </Typography>
      </Box>
      <Typography
        variant="overline"
        component="p"
        sx={{ px: 2.5, color: tokens.textMuted, fontSize: 11 }}
      >
        Apps
      </Typography>
      <List sx={{ px: 1, flex: 1, overflowY: "auto" }} dense>
        {apps.map((app) => {
          const selected = app.name === selectedName;
          return (
            <ListItemButton
              key={app.name}
              selected={selected}
              aria-current={selected ? "page" : undefined}
              onClick={() => {
                setLocation(`/${encodeURIComponent(app.name)}`);
                setDrawerOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: selected ? tokens.textPrimary : tokens.accentSoft,
                "&.Mui-selected, &.Mui-selected:hover": {
                  background: `linear-gradient(90deg, ${tokens.accent}, ${tokens.accentHover})`,
                },
              }}
            >
              <ListItemText
                primary={app.name}
                primaryTypographyProps={{ noWrap: true, fontWeight: 700, fontSize: 14 }}
              />
            </ListItemButton>
          );
        })}
      </List>
      {serverHost && (
        <Box sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${tokens.border}` }}>
          <Typography variant="caption" component="p" sx={{ color: tokens.textMuted }}>
            Server
          </Typography>
          <Typography
            variant="caption"
            component="p"
            sx={{ color: tokens.textSecondary, overflowWrap: "anywhere" }}
          >
            {serverHost}
          </Typography>
        </Box>
      )}
    </Box>
  );

  let content: React.ReactNode;
  if (loading) {
    content = <LoadingCard />;
  } else if (loadError) {
    content = (
      <ErrorCard title="Error loading apps" message={loadError} onRetry={loadApps} />
    );
  } else if (apps.length === 0) {
    content = (
      <EmptyState
        title="No apps"
        description="This account has no CodePush apps yet."
        icon={<AppsIcon sx={{ fontSize: 40 }} />}
      />
    );
  } else if (!selectedApp) {
    content = selectedName ? (
      <EmptyState
        title="App not found"
        description={`There is no app called "${selectedName}". Pick one from the list.`}
        icon={<SearchOffIcon sx={{ fontSize: 40 }} />}
      />
    ) : null;
  } else {
    // key: start fresh (tab, data, dialogs) when switching apps.
    content = <DeploymentTable key={selectedApp.name} app={selectedApp} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {isDesktop ? (
          <Box
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              position: "sticky",
              top: 0,
              height: "100vh",
            }}
          >
            {sidebar}
          </Box>
        ) : (
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
          >
            {sidebar}
          </Drawer>
        )}

        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          {!isDesktop && (
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                height: 52,
                backgroundColor: tokens.surface,
                borderBottom: `1px solid ${tokens.border}`,
              }}
            >
              <IconButton
                aria-label="Open app list"
                onClick={() => setDrawerOpen(true)}
                sx={{ color: tokens.accentSoft }}
              >
                <MenuIcon />
              </IconButton>
              <Typography sx={{ fontWeight: 800 }}>CodePush</Typography>
              {selectedApp && (
                <Typography noWrap sx={{ color: tokens.textMuted, minWidth: 0 }}>
                  / {selectedApp.name}
                </Typography>
              )}
            </Box>
          )}
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 2, sm: 3 },
              maxWidth: 1440,
              mx: "auto",
            }}
          >
            {content}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
