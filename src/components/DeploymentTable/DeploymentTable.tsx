import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CircularProgress from "@mui/material/CircularProgress";
import EditDeployment from "../EditDeployment/EditDeployment";
import RollbackModal from "../RollbackModal/RollbackModal";
import { getDeploymentHistory, rollbackToPreviousVersion } from "../../api/api";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import HistoryIcon from "@mui/icons-material/History";
import UpdateIcon from "@mui/icons-material/Update";
import RollbackIcon from "@mui/icons-material/Undo";
import EditIcon from "@mui/icons-material/Edit";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Chip from "@mui/material/Chip";
import { toast } from "react-toastify";

interface DeploymentTableProps {
  app: any;
  keyName: string;
}

const DeploymentTable: React.FC<DeploymentTableProps> = ({ app, keyName }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [deploymentHistories, setDeploymentHistories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [sortOption, setSortOption] = useState<string>("uploadTime"); // Default sorting by date
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // Default to descending

  const handleOpenModal = (deployment) => {
    setSelectedDeployment(deployment);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedDeployment(null);
  };

  const fetchDeploymentHistory = async () => {
    setLoading(true);
    try {
      const currentDeployment = app.deployments[activeTab];
      if (currentDeployment) {
        const history = await getDeploymentHistory(app.name, currentDeployment);
        setDeploymentHistories(history);
      } else {
        setDeploymentHistories([]);
      }
    } catch (error) {
      console.error("Error fetching deployment history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeploymentHistory();
  }, [app, activeTab]);

  const handleSort = (field: string) => {
    const newDirection =
      sortOption === field && sortDirection === "asc" ? "desc" : "asc";
    setSortOption(field);
    setSortDirection(newDirection);
  };

  const naturalCompare = (a: string, b: string) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };

  const sortedHistories = [...deploymentHistories].sort((a, b) => {
    const valueA = a[sortOption];
    const valueB = b[sortOption];

    if (sortOption === "label") {
      return sortDirection === "asc"
        ? naturalCompare(valueA, valueB)
        : naturalCompare(valueB, valueA);
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const getStatusLabel = (isDisabled: boolean) => (
    <Chip
      label={isDisabled ? "Disabled" : "Active"}
      style={{
        backgroundColor: isDisabled ? "#ff6f61" : "#81c784", // Red-ish for Disabled, Green-ish for Active
        color: "white",
        fontWeight: "bold",
      }}
    />
  );

  const handleRollbackCallback = (label: string) => {
    toast.success(`Rollback to version ${label} initiated`);
  };

  return (
    <div
      key={keyName}
      style={{
        padding: "20px",
        color: "white",
        backgroundColor: "#1e1e2f", // Purple tint applied to the entire app
        minHeight: "100vh",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        textColor="secondary"
        indicatorColor="secondary"
        style={{ marginBottom: "20px" }}
      >
        {app.deployments?.map((deployment, index) => (
          <Tab
            key={`${deployment?.otherDetails?.deploymentName}-${index}`}
            label={deployment || `Deployment ${index + 1}`}
            value={index}
            style={{ color: "#b39ddb" }}
          />
        ))}
      </Tabs>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <CircularProgress color="secondary" />
        </div>
      ) : deploymentHistories.length === 0 ? (
        <Typography
          variant="h6"
          style={{
            color: "white",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          No deployments
        </Typography>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Box
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 15px",
              backgroundColor: "#2c2c3e",
              borderRadius: "8px",
              marginBottom: "10px",
              color: "white", // Changed text color to white
              fontWeight: "bold",
            }}
          >
            <Box
              style={{
                flex: 2,
                minWidth: "100px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              onClick={() => handleSort("label")}
            >
              Label
              {sortOption === "label" &&
                (sortDirection === "asc" ? (
                  <ArrowDropUpIcon />
                ) : (
                  <ArrowDropDownIcon />
                ))}
            </Box>
            <Box
              style={{
                display: "flex",
                flex: 1,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box
                style={{
                  flex: 1,
                  textAlign: "center",
                  minWidth: "100px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onClick={() => handleSort("isMandatory")}
              >
                Mandatory
                {sortOption === "isMandatory" &&
                  (sortDirection === "asc" ? (
                    <ArrowDropUpIcon />
                  ) : (
                    <ArrowDropDownIcon />
                  ))}
              </Box>
              <Box
                style={{
                  flex: 1,
                  textAlign: "center",
                  minWidth: "100px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onClick={() => handleSort("isDisabled")}
              >
                Status
                {sortOption === "isDisabled" &&
                  (sortDirection === "asc" ? (
                    <ArrowDropUpIcon />
                  ) : (
                    <ArrowDropDownIcon />
                  ))}
              </Box>
              <Box
                style={{
                  flex: 1,
                  textAlign: "center",
                  minWidth: "100px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onClick={() => handleSort("rollout")}
              >
                Rollout
                {sortOption === "rollout" &&
                  (sortDirection === "asc" ? (
                    <ArrowDropUpIcon />
                  ) : (
                    <ArrowDropDownIcon />
                  ))}
              </Box>
              <Box style={{ flex: 1, textAlign: "center", minWidth: "100px" }}>
                Actions
              </Box>
            </Box>
          </Box>
          {sortedHistories.map((row, idx) => (
            <Box
              key={`${row.packageHash || idx}-${row.label}`} // Ensure unique keys
              style={{
                backgroundColor: "#2c2c3e",
                borderRadius: "8px",
                padding: "15px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <Box style={{ flex: 2, minWidth: "100px" }}>
                <Typography
                  variant="subtitle1"
                  style={{ color: "#b39ddb", fontWeight: "bold" }}
                >
                  {row.label}
                </Typography>
                <Typography variant="body2" style={{ color: "white" }}>
                  <strong>Date:</strong>{" "}
                  {new Date(row.uploadTime).toLocaleString()}
                </Typography>
                {row.appVersion && (
                  <Typography variant="body2" style={{ color: "white" }}>
                    <strong>Version:</strong> {row.appVersion}
                  </Typography>
                )}
                {row.description && (
                  <Typography variant="body2" style={{ color: "white" }}>
                    <strong>Description:</strong> {row.description}
                  </Typography>
                )}
              </Box>
              <Box
                style={{
                  display: "flex",
                  flex: 1,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box
                  style={{
                    flex: 1,
                    textAlign: "center",
                    minWidth: "100px",
                  }}
                >
                  {row.isMandatory ? (
                    <CheckCircleIcon style={{ color: "#7c4dff" }} /> // Bright purple for mandatory
                  ) : (
                    <CancelIcon style={{ color: "rgba(124, 77, 255, 0.5)" }} /> // Dimmed purple for not mandatory
                  )}
                </Box>
                <Box
                  style={{
                    flex: 1,
                    textAlign: "center",
                    minWidth: "100px",
                  }}
                >
                  {getStatusLabel(row.isDisabled)}
                </Box>
                <Box
                  style={{
                    flex: 1,
                    textAlign: "center",
                    minWidth: "100px",
                  }}
                >
                  {row.rollout ? `${row.rollout}%` : "N/A"}
                </Box>
                <Box
                  style={{
                    flex: 1,
                    textAlign: "center",
                    minWidth: "100px",
                  }}
                >
                  <Button
                    variant="contained"
                    style={{
                      backgroundColor: "#7c4dff",
                      color: "white",
                    }}
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() =>
                      handleOpenModal({
                        appName: app.name,
                        deploymentName: app.deployments[activeTab],
                        row,
                      })
                    }
                  >
                    Edit
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </div>
      )}

      <EditDeployment
        open={openModal}
        onClose={handleCloseModal}
        deployment={selectedDeployment}
        callback={fetchDeploymentHistory}
        rollbackCallback={handleRollbackCallback}
      />
    </div>
  );
};

export default DeploymentTable;
