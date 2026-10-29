import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface RollbackModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  versionToRollback: string;
  latestLabel?: string;
  deploymentName?: string;
  busy?: boolean;
}

const RollbackModal: React.FC<RollbackModalProps> = ({
  open,
  onClose,
  onConfirm,
  versionToRollback,
  latestLabel,
  deploymentName,
  busy = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="rollback-title"
    >
      <DialogTitle id="rollback-title">
        Roll back to {versionToRollback}?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          This publishes a copy of {versionToRollback} as a new release
          {deploymentName ? ` on ${deploymentName}` : ""}.
          {latestLabel
            ? ` Devices on ${latestLabel} move to it on their next update check.`
            : ""}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="text" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Rolling back…" : `Roll back to ${versionToRollback}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RollbackModal;
