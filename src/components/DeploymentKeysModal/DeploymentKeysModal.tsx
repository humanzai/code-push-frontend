import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { tokens } from "../../theme";

interface DeploymentKeysModalProps {
  open: boolean;
  onClose: () => void;
  keys: { name: string; key: string }[] | null;
  loading: boolean;
  error?: string;
}

const DeploymentKeysModal: React.FC<DeploymentKeysModalProps> = ({
  open,
  onClose,
  keys,
  loading,
  error,
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (name: string, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(name);
      setTimeout(() => setCopied((c) => (c === name ? null : c)), 1500);
    } catch {
      // Clipboard can be blocked (http, permissions); the key is still selectable.
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="keys-title">
      <DialogTitle id="keys-title">Deployment keys</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ textAlign: "center", p: 3 }}>
            <CircularProgress aria-label="Loading deployment keys" />
          </Box>
        ) : error ? (
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        ) : keys && keys.length > 0 ? (
          <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5 }}>
            {keys.map((k) => (
              <Box
                key={k.name}
                sx={{
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Typography component="dt" variant="subtitle2">
                  {k.name}
                </Typography>
                <Box
                  component="dd"
                  sx={{ m: 0, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Typography
                    component="code"
                    sx={{
                      fontSize: 13,
                      color: tokens.textSecondary,
                      overflowWrap: "anywhere",
                      flex: 1,
                      userSelect: "all",
                    }}
                  >
                    {k.key}
                  </Typography>
                  <Tooltip title={copied === k.name ? "Copied" : "Copy key"}>
                    <IconButton
                      size="small"
                      aria-label={`Copy ${k.name} key`}
                      onClick={() => copy(k.name, k.key)}
                      sx={{ color: tokens.accentSoft }}
                    >
                      {copied === k.name ? (
                        <CheckIcon fontSize="small" />
                      ) : (
                        <ContentCopyIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ textAlign: "center", p: 3, color: tokens.textSecondary }}>
            No deployment keys found.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeploymentKeysModal;
