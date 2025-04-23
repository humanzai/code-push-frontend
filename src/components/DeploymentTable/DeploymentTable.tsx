import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CircularProgress from "@mui/material/CircularProgress";
import EditDeployment from "../EditDeployment/EditDeployment";
import {
  getDeploymentHistory,
  rollbackDeployment,
  getDeploymentMetrics,
} from "../../api/api";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Chip from "@mui/material/Chip";
import DeploymentKeysModal from "../DeploymentKeysModal/DeploymentKeysModal";
import { getDeploymentKeys } from "../../api/api";
import Metrics from "../Metrics/Metrics";
import PieChartComponent from "../Metrics/PieChartComponent"; // Import the PieChartComponent
import RolloutChartComponent from "../Metrics/RolloutChartComponent"; // Import the RolloutChartComponent

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
  const [keysModalOpen, setKeysModalOpen] = useState(false);
  const [deploymentKeys, setDeploymentKeys] = useState<
    { name: string; key: string }[] | null
  >(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [deploymentMetrics, setDeploymentMetrics] = useState<any | null>(null);

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

  const fetchDeploymentMetrics = async () => {
    try {
      const currentDeployment = app.deployments[activeTab];
      if (currentDeployment) {
        const metrics = await getDeploymentMetrics(app.name, currentDeployment);

        // Aggregate only the active installs across all versions
        const aggregatedMetrics = Object.entries(metrics?.metrics || {}).reduce(
          (acc, [_, value]) => {
            acc.active += value?.active > 0 ? value?.active : 0 || 0; // Sum only the active installs
            return acc;
          },
          { active: 0 }
        );

        setDeploymentMetrics({
          aggregated: aggregatedMetrics,
          versions: metrics?.metrics || null,
        });
      } else {
        setDeploymentMetrics(null);
      }
    } catch (error) {
      console.error("Error fetching deployment metrics", error);
    }
  };

  useEffect(() => {
    fetchDeploymentHistory();
    fetchDeploymentMetrics();
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

  const handleRollbackCallback = async (
    label: string,
    callbackSuccess?: () => void,
    callbackFail?: () => void
  ) => {
    try {
      await rollbackDeployment(app.name, app.deployments[activeTab], label);
      callbackSuccess && callbackSuccess();
    } catch (error) {
      console.error("Error during rollback:", error);
      callbackFail && callbackFail(error);
    }
  };

  const handleOpenKeysModal = async () => {
    setKeysModalOpen(true);
    setKeysLoading(true);
    try {
      const keys = await getDeploymentKeys(app.name); // Fetch keys for the current app
      setDeploymentKeys(keys);
    } catch (error) {
      console.error("Error fetching deployment keys:", error);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleCloseKeysModal = () => {
    setKeysModalOpen(false);
    setDeploymentKeys(null);
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
        <Box style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
          <Button
            style={{
              justifySelf: "flex-end",
              display: "inline-flex",
            }}
            variant="text"
            onClick={handleOpenKeysModal}
          >
            View Deployment Keys
          </Button>
        </Box>
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
                placeContent: "center",
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
                  placeContent: "center",
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
                  placeContent: "center",
                }}
                onClick={() => handleSort("isDisabled")}
              >
                Status
                {sortOption === "isDisabled" &&
                  (sortDirection === "asc" ? (
                    <ArrowDropUpIcon />
                  ) : (
                    <ArrowDropDownIcon /> // Corrected closing parentheses
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
                  placeContent: "center",
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
              <Box
                style={{
                  flex: 1,
                  textAlign: "center",
                  minWidth: "100px",
                  placeContent: "center",
                }}
              >
                Active Installs
              </Box>
              <Box
                style={{
                  flex: 1,
                  textAlign: "center",
                  minWidth: "100px",
                  placeContent: "center",
                }}
              >
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
                {deploymentMetrics?.versions?.[row.label] && (
                  <Metrics
                    metrics={deploymentMetrics.versions[row.label]}
                    aggregatedMetrics={deploymentMetrics.aggregated} // Pass aggregated metrics
                  />
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
                  {row.rollout ? (
                    <RolloutChartComponent rollout={row.rollout} />
                  ) : (
                    "N/A"
                  )}
                </Box>
                <Box
                  style={{
                    flex: 1,
                    textAlign: "center",
                    minWidth: "100px",
                  }}
                >
                  {deploymentMetrics?.versions?.[row.label] && (
                    <PieChartComponent
                      active={
                        deploymentMetrics.versions[row.label]?.active || 0
                      }
                      total={deploymentMetrics.aggregated?.active || 0}
                    />
                  )}
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

      <DeploymentKeysModal
        open={keysModalOpen}
        onClose={handleCloseKeysModal}
        keys={deploymentKeys}
        loading={keysLoading}
      />
    </div>
  );
};

export default DeploymentTable;
