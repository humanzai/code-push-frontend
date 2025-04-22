import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import InfoIcon from "@mui/icons-material/Info";
import { updateDeploymentRelease } from "../../api/api";
import RollbackModal from "../RollbackModal/RollbackModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface EditDeploymentProps {
  deployment: any;
  onClose: () => void;
  callback: () => void;
  open: boolean;
  rollbackCallback: (
    label: string,
    successCallback?: () => void,
    failCallback?: () => void
  ) => void;
}

const EditDeployment: React.FC<EditDeploymentProps> = ({
  deployment,
  onClose,
  open,
  callback,
  rollbackCallback,
}) => {
  if (!deployment) {
    return null;
  }

  const { appName, deploymentName, row } = deployment;
  const [formValues, setFormValues] = useState({
    appVersion: row?.appVersion || "",
    description: row?.description || "",
    isMandatory: row?.isMandatory || false,
    rollout: row?.rollout ?? null, // Default to null
    isDisabled: row?.isDisabled || false,
    enableRollout: row?.rollout !== null, // Toggle for rollout slider
  });

  const [openRollbackModal, setOpenRollbackModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleRolloutChange = (event: Event, newValue: number | number[]) => {
    setFormValues({
      ...formValues,
      rollout: newValue as number,
    });
  };

  const handleToggleRollout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setFormValues({
      ...formValues,
      enableRollout: isEnabled,
      rollout: isEnabled ? 0 : null, // Reset rollout to 0 if enabled, null if disabled
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { rollout, ...rest } = formValues;
      const payload: any = {
        ...rest,
        rollout: rollout ? Number(rollout) : undefined,
      };
      await updateDeploymentRelease(appName, deploymentName, payload);
      callback();
      toast.success("Deployment updated successfully");
    } catch (error) {
      console.error("Error updating deployment", error);
      toast.error("Failed to update deployment");
    } finally {
      onClose();
    }
  };

  const handleRollback = () => {
    setOpenRollbackModal(true);
  };

  const handleCloseRollbackModal = () => {
    setOpenRollbackModal(false);
  };

  const handleConfirmRollback = () => {
    rollbackCallback(
      row.label,
      () => {
        toast.success(`Rollback to version ${row.label} initiated`);
      },
      (error) => {
        toast.error(`Failed to rollback to version ${row.label}: ${error}`);
      }
    );
    setOpenRollbackModal(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          style: {
            backgroundColor: "#2c2c3e", // Purple-ish background
            color: "white",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Subtle shadow for depth
          },
        }}
        BackdropProps={{
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent backdrop
          },
        }}
      >
        <DialogTitle style={{ backgroundColor: "#2c2c3e", color: "white" }}>
          Edit Deployment
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#2c2c3e", color: "white" }}>
          <div style={{ marginBottom: "20px", marginTop: "10px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "#2c2c3e",
              }}
            >
              <tbody>
                {[
                  { label: "App Name", value: deployment.appName },
                  {
                    label: "Deployment Name",
                    value: deployment.deploymentName,
                  },
                  {
                    label: "App Version",
                    value: deployment.row?.appVersion || "N/A",
                  },
                  {
                    label: "Description",
                    value: deployment.row?.description || "N/A",
                  },
                  {
                    label: "Mandatory",
                    value: deployment.row?.isMandatory ? "Yes" : "No",
                  },
                  { label: "Rollout", value: deployment.row?.rollout || "N/A" },
                  {
                    label: "Disabled",
                    value: deployment.row?.isDisabled ? "Yes" : "No",
                  },
                ].map((row, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        fontWeight: "bold",
                        padding: "8px",
                        border: "1px solid #4a4a5e",
                        color: "#b39ddb",
                      }}
                    >
                      {row.label}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        border: "1px solid #4a4a5e",
                        color: "white",
                      }}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Tooltip
                title="Specify the version of the app for this deployment"
                arrow
              >
                <IconButton size="small" sx={{ color: "#b39ddb" }}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <TextField
                label="App Version"
                name="appVersion"
                value={formValues.appVersion}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                InputProps={{
                  style: { backgroundColor: "#2c2c3e", color: "white" },
                }}
                InputLabelProps={{
                  style: { color: "#b39ddb" },
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Tooltip title="Provide a description for this deployment" arrow>
                <IconButton size="small" sx={{ color: "#b39ddb" }}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <TextField
                label="Description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                InputProps={{
                  style: { backgroundColor: "#2c2c3e", color: "white" },
                }}
                InputLabelProps={{
                  style: { color: "#b39ddb" },
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Tooltip
                title="Enable gradual rollout of the deployment to a percentage of users"
                arrow
              >
                <IconButton size="small" sx={{ color: "#b39ddb" }}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.enableRollout}
                    onChange={handleToggleRollout}
                    name="enableRollout"
                    color="primary"
                  />
                }
                label="Enable Rollout"
                style={{ color: "white" }}
              />
            </div>
            {formValues.enableRollout && (
              <div
                style={{ padding: "10px 0", width: "80%", margin: "0 auto" }}
              >
                <Typography
                  style={{ color: "#b39ddb", marginBottom: "10px" }}
                  variant="body2"
                >
                  Rollout Percentage
                </Typography>
                <Slider
                  value={formValues.rollout || 0} // Default to 0 if null
                  onChange={handleRolloutChange}
                  aria-labelledby="rollout-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks={[
                    { value: 0, label: "0%" },
                    { value: 100, label: "100%" },
                  ]}
                  min={0}
                  max={100}
                  style={{ color: "#7c4dff" }}
                />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Tooltip
                title="Mark this deployment as mandatory for all users"
                arrow
              >
                <IconButton size="small" sx={{ color: "#b39ddb" }}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.isMandatory}
                    onChange={handleChange}
                    name="isMandatory"
                    color="primary"
                  />
                }
                label="Mandatory Update"
                style={{ color: "white" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Tooltip
                title="Disable this deployment to prevent further updates"
                arrow
              >
                <IconButton size="small" sx={{ color: "#b39ddb" }}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.isDisabled}
                    onChange={handleChange}
                    name="isDisabled"
                    color="primary"
                  />
                }
                label="Disabled"
                style={{ color: "white" }}
              />
            </div>
          </form>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <Tooltip
              title="Rollback to a previous version of the deployment"
              arrow
            >
              <IconButton size="small" sx={{ color: "#b39ddb" }}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained" onClick={handleRollback}>
              Rollback to this Version
            </Button>
          </div>
        </DialogContent>
        <DialogActions>
          <Button type="button" variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" onClick={handleSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <RollbackModal
        open={openRollbackModal}
        onClose={handleCloseRollbackModal}
        onConfirm={handleConfirmRollback}
        versionToRollback={row.label}
      />
    </>
  );
};

export default EditDeployment;
