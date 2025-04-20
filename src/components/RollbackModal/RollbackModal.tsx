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
}

const RollbackModal: React.FC<RollbackModalProps> = ({
  open,
  onClose,
  onConfirm,
  versionToRollback,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Rollback Confirmation</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to rollback to the previous version -{" "}
          {versionToRollback}?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="text" color="secondary" onClick={onClose}>
          No
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirm}>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RollbackModal;
