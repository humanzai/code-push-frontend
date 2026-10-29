import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { toast } from "react-toastify";
import { updateDeploymentRelease } from "../../api/api";
import RollbackModal from "../RollbackModal/RollbackModal";
import { Release, isStagedRollout } from "../../utils/metrics";
import { formatDateTime } from "../../utils/format";
import { tokens } from "../../theme";

interface EditDeploymentProps {
  appName: string;
  deploymentName: string;
  release: Release;
  latest: Release | null;
  onClose: () => void;
  onSaved: () => void;
  onRollback: (label: string) => Promise<void>;
}

// Mounted only while a release is being edited (keyed by label), so the form
// state always starts from the release that was clicked.
const EditDeployment: React.FC<EditDeploymentProps> = ({
  appName,
  deploymentName,
  release,
  latest,
  onClose,
  onSaved,
  onRollback,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const staged = isStagedRollout(release.rollout);
  const currentRollout = staged ? (release.rollout as number) : 100;

  const [appVersion, setAppVersion] = useState(release.appVersion || "");
  const [description, setDescription] = useState(release.description || "");
  const [isMandatory, setIsMandatory] = useState(!!release.isMandatory);
  const [isDisabled, setIsDisabled] = useState(!!release.isDisabled);
  const [rollout, setRollout] = useState(currentRollout);
  const [saving, setSaving] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const isLatest = latest?.label === release.label;
  const rollbackBlocker = !latest
    ? "No latest release found."
    : isLatest
    ? "This is already the latest release."
    : release.appVersion !== latest.appVersion
    ? `Only releases for the same binary as the latest (${latest.appVersion}) can be rolled back to.`
    : "";

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      // The server only allows raising the rollout of an unfinished staged
      // rollout, and ignores an empty description / appVersion.
      const payload: {
        appVersion?: string;
        description?: string;
        isMandatory: boolean;
        isDisabled: boolean;
        rollout?: number;
      } = { isMandatory, isDisabled };
      if (appVersion.trim()) payload.appVersion = appVersion.trim();
      if (description.trim()) payload.description = description.trim();
      if (staged && rollout > currentRollout) payload.rollout = rollout;

      await updateDeploymentRelease(appName, deploymentName, release.label, payload);
      toast.success(`${release.label} updated`);
      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Error updating deployment", error);
      toast.error(`Failed to update ${release.label}: ${error?.message || "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRollback = async () => {
    setRollingBack(true);
    try {
      await onRollback(release.label);
      toast.success(`${deploymentName} rolled back to ${release.label} (published as a new release)`);
      setRollbackOpen(false);
      onClose();
    } catch (error: any) {
      console.error("Error during rollback:", error);
      toast.error(`Rollback to ${release.label} failed: ${error?.message || "unknown error"}`);
      setRollbackOpen(false);
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <>
      <Dialog
        open
        onClose={saving ? undefined : onClose}
        fullWidth
        maxWidth="sm"
        fullScreen={fullScreen}
        aria-labelledby="edit-release-title"
      >
        <DialogTitle id="edit-release-title" sx={{ pb: 0.5 }}>
          Edit {release.label}
        </DialogTitle>
        <Typography variant="body2" sx={{ px: 3, color: tokens.textMuted }}>
          {appName} · {deploymentName} · released {formatDateTime(release.uploadTime)}
          {isLatest ? " · latest" : ""}
        </Typography>
        <DialogContent>
          <Box
            component="form"
            id="edit-release-form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            <TextField
              label="Target binary version"
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              fullWidth
              helperText="Store app version (or range) this update is offered to, e.g. 3.22.9"
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              helperText="Shown to users for update prompts. Can't be cleared once set."
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Rollout
              </Typography>
              {staged ? (
                <>
                  <Box sx={{ px: 1 }}>
                    <Slider
                      value={rollout}
                      onChange={(_e, v) => setRollout(Math.max(currentRollout, v as number))}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v}%`}
                      step={1}
                      min={0}
                      max={100}
                      marks={[
                        { value: currentRollout, label: `${currentRollout}% now` },
                        { value: 100, label: "100%" },
                      ]}
                      aria-label="Rollout percentage"
                    />
                  </Box>
                  <FormHelperText>
                    {rollout}% of devices allowed. Rollout can only go up; 100%
                    finishes the staged rollout.
                  </FormHelperText>
                </>
              ) : (
                <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
                  100% of devices allowed. The rollout can only be changed while
                  a staged rollout is in progress (set at release time with{" "}
                  <code>--rollout</code>).
                </Typography>
              )}
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} />
                }
                label="Mandatory update"
              />
              <FormHelperText sx={{ mt: -0.5 }}>
                Devices install it right away instead of on the next restart.
              </FormHelperText>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch checked={isDisabled} onChange={(e) => setIsDisabled(e.target.checked)} />
                }
                label="Disabled"
              />
              <FormHelperText sx={{ mt: -0.5 }}>
                Disabled releases are not offered to any device.
                {isLatest && isDisabled && !release.isDisabled
                  ? " Disabling the latest release stops it from reaching new devices."
                  : ""}
              </FormHelperText>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2">Roll back to this release</Typography>
          <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 0.5, mb: 1.5 }}>
            Publishes a copy of {release.label} as a new release on {deploymentName}.
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => setRollbackOpen(true)}
            disabled={!!rollbackBlocker || saving}
          >
            Roll back to {release.label}
          </Button>
          {rollbackBlocker && <FormHelperText>{rollbackBlocker}</FormHelperText>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" variant="text" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-release-form" variant="contained" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      <RollbackModal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        onConfirm={handleConfirmRollback}
        versionToRollback={release.label}
        latestLabel={latest?.label}
        deploymentName={deploymentName}
        busy={rollingBack}
      />
    </>
  );
};

export default EditDeployment;
