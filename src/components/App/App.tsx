import React, { useEffect, useState } from "react";
import { getApps } from "../../api/api";
import { Link, Route, Router, Switch } from "wouter";
import DeploymentTable from "../DeploymentTable/DeploymentTable";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import "./App.css";
import { useLocation } from "wouter";
import AppsIcon from "@mui/icons-material/Apps";

const darkTheme = createTheme({
  typography: {
    fontFamily: "Nunito, Arial, sans-serif",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@global": {
          "*": {
            fontFamily: "Nunito, Arial, sans-serif",
          },
          body: {
            backgroundColor: "#1e1e2f", // Purple tint for the entire app
            color: "#ffffff",
            },
          },
          },
        },
        MuiButton: {
          styleOverrides: {
          root: {
            "&.MuiButton-contained": {
            backgroundColor: "#7c4dff", // Unified button color for contained variant
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#9575cd", // Lighter hover effect
            },
            },
          },
          },
        },
        MuiDialog: {
          styleOverrides: {
          paper: {
            backgroundColor: "#2c2c3e", // Purple tint for modals
          color: "#ffffff",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#2c2c3e", // Purple tint for input fields
            color: "#ffffff",
            "& fieldset": {
              borderColor: "#4a4a5e", // Subtler border color
            },
            "&:hover fieldset": {
              borderColor: "#7c7c9a",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#b39ddb",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#b39ddb",
          },
        },
      },
    },
  },
  palette: {
    mode: "dark",
    background: {
      default: "#1e1e2f", // Purple tint for background
    },
    text: {
      primary: "#ffffff",
    },
  },
});

const App: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    setLoading(true);
    getApps()
      .then((response) => {
        if (response?.apps) {
          setApps(response.apps);
        } else {
          console.error("No apps found in the response");
        }
      })
      .catch((error) => {
        console.error("Error fetching apps:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (apps.length > 0 && location === "/") {
      setLocation(`/${apps[0].name}`);
    }
  }, [apps, location, setLocation]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const SidebarContent = (
    <Box
      sx={{
        width: "250px",
        backgroundColor: "#2c2c3e", // Purple-tinted sidebar
        color: "white",
        padding: "20px",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Typography
          sx={{
            fontWeight: "bold",
            color: "white",
            fontSize: "18px",
          }}
        >
          CodePush Deployments
        </Typography>
      </Box>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {apps.map((app) => (
          <li key={app.name} style={{ marginBottom: "10px" }}>
            <Link
              href={`/${app.name}`}
              style={{
                textDecoration: "none",
              }}
            >
              <Box
                sx={{
                  padding: "10px",
                  borderRadius: "8px",
                  background:
                    location === `/${app.name}`
                      ? "linear-gradient(90deg, #7c4dff, #9575cd)" // Gradient for selected app
                      : "transparent",
                  color: location === `/${app.name}` ? "white" : "#b39ddb",
                  transition: "0.3s all", // Smooth transition effect
                  "&:hover": {
                    backgroundColor: "#673ab7",
                    color: "white",
                  },
                }}
              >
                {app.name}
              </Box>
            </Link>
          </li>
        ))}
      </ul>
    </Box>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            minWidth: "910px", // Added minWidth for the page
            overflowX: "auto",
          }}
        >
          {SidebarContent}
          <Box
            sx={{
              flex: 1,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              overflowX: "auto",
              backgroundColor: "#1e1e2f",
              gap: "3px", // Added gap for all columns
            }}
          >
            <Switch>
              {apps.length > 0 ? (
                apps.map((app) => (
                  <Route
                    key={app.name}
                    path={`/${app.name}`}
                    component={() =>
                      apps[0]?.deployments?.length > 0 ? (
                        <Box
                          sx={{
                            backgroundColor: "#2c2c3e",
                            padding: "20px",
                            borderRadius: "8px",
                            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          <DeploymentTable app={app} keyName={app?.name} />
                        </Box>
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{
                            color: "white",
                            textAlign: "center",
                            marginTop: "20px",
                          }}
                        >
                          No deployments
                        </Typography>
                      )
                    }
                  />
                ))
              ) : (
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    textAlign: "center",
                    marginTop: "20px",
                  }}
                >
                  No deployments
                </Typography>
              )}
            </Switch>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
