import React, { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TableSortLabel from "@mui/material/TableSortLabel";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { alpha } from "@mui/material/styles";
import EditDeployment from "../EditDeployment/EditDeployment";
import DeploymentKeysModal from "../DeploymentKeysModal/DeploymentKeysModal";
import ReleaseOverview, { LoadStatus } from "./ReleaseOverview";
import { SurfaceCard, EmptyState } from "../common/ui";
import { tokens, softChip } from "../../theme";
import {
  getDeploymentHistory,
  getDeploymentMetrics,
  getDeploymentKeys,
  rollbackDeployment,
  apiErrorMessage,
} from "../../api/api";
import {
  Release,
  DeploymentMetrics,
  getLatestRelease,
  labelNumber,
  metricsFor,
  effectiveRollout,
  isStagedRollout,
  failureRate,
  failureSeverity,
} from "../../utils/metrics";
import {
  formatDateTime,
  formatInt,
  formatPercent,
  formatRelative,
} from "../../utils/format";

interface DeploymentTableProps {
  app: { name: string; deployments?: string[] };
}

type SortField = "label" | "rollout" | "active" | "installed" | "failed";

const ROWS_COLLAPSED = 15;

// Grid shared by the header and each row (single column on small screens).
const ROW_GRID = {
  xs: "minmax(0, 1fr) auto",
  md: "minmax(0, 3fr) repeat(4, minmax(72px, 1fr)) 88px",
};
// Small screens: label + Edit on top, the four numbers below.
const ROW_AREAS = { xs: '"info edit" "nums nums"', md: "none" };

const DeploymentTable: React.FC<DeploymentTableProps> = ({ app }) => {
  const deployments = app.deployments || [];
  const [activeTab, setActiveTab] = useState(0);
  const deploymentName: string | undefined = deployments[activeTab];

  const [history, setHistory] = useState<Release[]>([]);
  const [historyStatus, setHistoryStatus] = useState<LoadStatus>("loading");
  const [historyError, setHistoryError] = useState("");
  const [metrics, setMetrics] = useState<DeploymentMetrics | null>(null);
  const [metricsStatus, setMetricsStatus] = useState<LoadStatus>("loading");

  const [editTarget, setEditTarget] = useState<Release | null>(null);
  const [sortField, setSortField] = useState<SortField>("label");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAll, setShowAll] = useState(false);

  const [keysModalOpen, setKeysModalOpen] = useState(false);
  const [deploymentKeys, setDeploymentKeys] = useState<
    { name: string; key: string }[] | null
  >(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState("");

  // Ignore responses that belong to a previous tab / reload.
  const requestIdRef = useRef(0);

  const loadMetrics = useCallback(
    async (requestId: number) => {
      if (!deploymentName) return;
      setMetricsStatus("loading");
      try {
        const res = await getDeploymentMetrics(app.name, deploymentName);
        if (requestIdRef.current !== requestId) return;
        setMetrics(res?.metrics || {});
        setMetricsStatus("ready");
      } catch (error) {
        if (requestIdRef.current !== requestId) return;
        console.error("Error fetching deployment metrics", error);
        setMetrics(null);
        setMetricsStatus("error");
      }
    },
    [app.name, deploymentName]
  );

  const loadAll = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!deploymentName) {
      setHistory([]);
      setHistoryStatus("ready");
      return;
    }
    setHistoryStatus("loading");
    loadMetrics(requestId);
    try {
      const res = await getDeploymentHistory(app.name, deploymentName);
      if (requestIdRef.current !== requestId) return;
      setHistory(Array.isArray(res) ? res : []);
      setHistoryStatus("ready");
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      console.error("Error fetching deployment history", error);
      setHistoryError(apiErrorMessage(error, "Couldn't load releases"));
      setHistoryStatus("error");
    }
  }, [app.name, deploymentName, loadMetrics]);

  // New tab (or app): clear what belongs to the old one, then load.
  useEffect(() => {
    setHistory([]);
    setMetrics(null);
    setEditTarget(null);
    setShowAll(false);
    loadAll();
  }, [loadAll]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortValue = (r: Release): number => {
    const m = metricsFor(metrics, r.label);
    switch (sortField) {
      case "rollout":
        return effectiveRollout(r.rollout);
      case "active":
        return m ? m.active : -1;
      case "installed":
        return m?.installed ?? -1;
      case "failed":
        return m?.failed ?? -1;
      default:
        return labelNumber(r.label);
    }
  };

  // Labels sort numerically (v10 after v9); ties fall back to label order.
  const sorted = [...history].sort((a, b) => {
    const diff = sortValue(a) - sortValue(b);
    const tie = labelNumber(a.label) - labelNumber(b.label);
    return (sortDirection === "asc" ? 1 : -1) * (diff || tie);
  });
  const visible = showAll ? sorted : sorted.slice(0, ROWS_COLLAPSED);
  const latest = getLatestRelease(history);

  const handleRollback = async (label: string) => {
    if (!deploymentName) return;
    await rollbackDeployment(app.name, deploymentName, label);
    loadAll();
  };

  const handleOpenKeysModal = async () => {
    setKeysModalOpen(true);
    setKeysLoading(true);
    setKeysError("");
    try {
      setDeploymentKeys(await getDeploymentKeys(app.name));
    } catch (error) {
      console.error("Error fetching deployment keys:", error);
      setKeysError(apiErrorMessage(error, "Couldn't load deployment keys"));
    } finally {
      setKeysLoading(false);
    }
  };

  const handleCloseKeysModal = () => {
    setKeysModalOpen(false);
    setDeploymentKeys(null);
  };

  let body: React.ReactNode;
  if (!deploymentName) {
    body = (
      <EmptyState
        title="No deployments"
        description={`${app.name} has no deployments yet.`}
        icon={<Inventory2OutlinedIcon sx={{ fontSize: 40 }} />}
      />
    );
  } else if (historyStatus === "loading" && history.length === 0) {
    body = (
      <Box aria-busy="true" aria-label="Loading releases" sx={{ display: "grid", gap: 2 }}>
        <Skeleton variant="rounded" height={64} sx={{ maxWidth: 360 }} />
        <Skeleton variant="rounded" height={260} />
        <Skeleton variant="rounded" height={320} />
      </Box>
    );
  } else if (historyStatus === "error") {
    body = (
      <Alert
        severity="error"
        variant="outlined"
        action={
          <Button color="inherit" size="small" onClick={loadAll}>
            Retry
          </Button>
        }
      >
        Couldn't load releases for {deploymentName}: {historyError}
      </Alert>
    );
  } else if (!latest) {
    body = (
      <EmptyState
        title={`No releases in ${deploymentName} yet`}
        description={
          <>
            Releases show up here after the first OTA update is published to
            this deployment, for example:
            <Box
              component="code"
              sx={{
                display: "block",
                mt: 1.5,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                backgroundColor: tokens.bg,
                color: tokens.textPrimary,
                fontSize: 13,
                overflowWrap: "anywhere",
              }}
            >
              code-push release-react {app.name} &lt;platform&gt; -d {deploymentName}
            </Box>
          </>
        }
        icon={<Inventory2OutlinedIcon sx={{ fontSize: 40 }} />}
      />
    );
  } else {
    body = (
      <>
        <ReleaseOverview
          latest={latest}
          history={history}
          metrics={metrics}
          metricsStatus={metricsStatus}
          onRetryMetrics={() => loadMetrics(requestIdRef.current)}
          onEdit={() => setEditTarget(latest)}
        />
        <ReleaseList
          rows={visible}
          total={history.length}
          latestLabel={latest.label}
          metrics={metrics}
          metricsReady={metricsStatus === "ready"}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEdit={setEditTarget}
          showAll={showAll}
          onToggleShowAll={() => setShowAll((s) => !s)}
        />
      </>
    );
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{ minWidth: 0, overflowWrap: "anywhere" }}
        >
          {app.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Button
            variant="text"
            startIcon={<VpnKeyOutlinedIcon />}
            onClick={handleOpenKeysModal}
            sx={{ color: tokens.accentSoft }}
          >
            Deployment keys
          </Button>
          <Tooltip title="Reload releases and metrics">
            <span>
              <IconButton
                aria-label="Reload releases and metrics"
                onClick={loadAll}
                disabled={!deploymentName || historyStatus === "loading"}
                sx={{ color: tokens.accentSoft }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {deployments.length > 0 && (
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Deployments"
          sx={{
            mb: 3,
            borderBottom: `1px solid ${tokens.border}`,
            "& .MuiTab-root": { color: tokens.textMuted },
            "& .MuiTab-root.Mui-selected": { color: tokens.textPrimary },
          }}
        >
          {deployments.map((name, index) => (
            <Tab key={name} label={name} value={index} />
          ))}
        </Tabs>
      )}

      {body}

      {editTarget && deploymentName && (
        <EditDeployment
          key={editTarget.label}
          appName={app.name}
          deploymentName={deploymentName}
          release={editTarget}
          latest={latest}
          onClose={() => setEditTarget(null)}
          onSaved={loadAll}
          onRollback={handleRollback}
        />
      )}

      <DeploymentKeysModal
        open={keysModalOpen}
        onClose={handleCloseKeysModal}
        keys={deploymentKeys}
        loading={keysLoading}
        error={keysError}
      />
    </Box>
  );
};

/* ---------- Release list ---------- */

interface ReleaseListProps {
  rows: Release[];
  total: number;
  latestLabel: string;
  metrics: DeploymentMetrics | null;
  metricsReady: boolean;
  sortField: SortField;
  sortDirection: "asc" | "desc";
  onSort: (f: SortField) => void;
  onEdit: (r: Release) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}

const COLUMNS: { field: SortField; label: string; hint: string }[] = [
  { field: "rollout", label: "Rollout", hint: "Setting: % of devices allowed" },
  { field: "active", label: "Active", hint: "Devices whose current update is this release" },
  { field: "installed", label: "Installs", hint: "Successful installs reported, total" },
  { field: "failed", label: "Failed", hint: "Rollbacks, with failure rate" },
];

const ReleaseList: React.FC<ReleaseListProps> = ({
  rows,
  total,
  latestLabel,
  metrics,
  metricsReady,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  showAll,
  onToggleShowAll,
}) => {
  // "…" while metrics load, "—" when the server has no reports for the label.
  const num = (n: number | null | undefined) =>
    !metricsReady ? "…" : typeof n === "number" ? formatInt(Math.max(0, n)) : "—";

  return (
    <SurfaceCard aria-label="All releases" sx={{ p: { xs: 0, sm: 0 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          px: { xs: 2, sm: 2.5 },
          pt: 2,
          pb: 1,
        }}
      >
        <Typography variant="h6" component="h2">
          All releases
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.textMuted }}>
          {total} total
        </Typography>
      </Box>

      {/* Sortable column headers (md+) */}
      <Box
        sx={{
          display: { xs: "none", md: "grid" },
          gridTemplateColumns: ROW_GRID.md,
          gap: 2,
          px: 2.5,
          py: 1,
          borderTop: `1px solid ${tokens.border}`,
          borderBottom: `1px solid ${tokens.border}`,
          "& .MuiTableSortLabel-root": {
            color: tokens.textMuted,
            fontSize: 12,
            fontWeight: 700,
          },
          "& .MuiTableSortLabel-root.Mui-active": { color: tokens.textPrimary },
          "& .MuiTableSortLabel-icon": { color: "inherit !important" },
        }}
      >
        <Box>
          <TableSortLabel
            active={sortField === "label"}
            direction={sortField === "label" ? sortDirection : "desc"}
            onClick={() => onSort("label")}
          >
            Release
          </TableSortLabel>
        </Box>
        {COLUMNS.map((c) => (
          <Box key={c.field} sx={{ textAlign: "right" }}>
            <Tooltip title={c.hint} describeChild>
              <TableSortLabel
                active={sortField === c.field}
                direction={sortField === c.field ? sortDirection : "desc"}
                onClick={() => onSort(c.field)}
              >
                {c.label}
              </TableSortLabel>
            </Tooltip>
          </Box>
        ))}
        <Box />
      </Box>

      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {rows.map((row) => {
          const m = metricsFor(metrics, row.label);
          const rate = failureRate(m);
          const severity = failureSeverity(rate);
          const isLatest = row.label === latestLabel;
          const failed = m ? m.failed ?? 0 : null;
          const cells: { label: string; value: React.ReactNode; color?: string }[] = [
            {
              label: "Rollout",
              value: `${effectiveRollout(row.rollout)}%`,
              color: isStagedRollout(row.rollout) ? tokens.info : undefined,
            },
            { label: "Active", value: num(m ? m.active : null) },
            { label: "Installs", value: num(m ? m.installed ?? 0 : null) },
            {
              label: "Failed",
              value:
                metricsReady && failed
                  ? `${formatInt(failed)} (${formatPercent(rate)})`
                  : num(failed),
              color:
                severity === "bad"
                  ? tokens.error
                  : severity === "warn"
                  ? tokens.warning
                  : undefined,
            },
          ];

          return (
            <Box
              component="li"
              key={`${row.label}-${row.packageHash || ""}`}
              sx={{
                display: "grid",
                gridTemplateColumns: ROW_GRID,
                gridTemplateAreas: ROW_AREAS,
                gap: { xs: 1.5, md: 2 },
                alignItems: "center",
                px: { xs: 2, sm: 2.5 },
                py: 1.5,
                borderBottom: `1px solid ${alpha(tokens.border, 0.6)}`,
                "&:last-of-type": { borderBottom: "none" },
                backgroundColor: isLatest ? alpha(tokens.accent, 0.07) : "transparent",
              }}
            >
              <Box sx={{ minWidth: 0, gridArea: { xs: "info", md: "auto" } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 800, color: tokens.accentSoft }}>
                    {row.label}
                  </Typography>
                  {isLatest && <Chip label="Latest" size="small" sx={softChip(tokens.accentSoft)} />}
                  {row.isDisabled && <Chip label="Disabled" size="small" sx={softChip(tokens.error)} />}
                  {row.isMandatory && (
                    <Chip label="Mandatory" size="small" sx={softChip(tokens.textSecondary)} />
                  )}
                  {row.releaseMethod === "Rollback" && (
                    <Chip
                      label={row.originalLabel ? `Rollback of ${row.originalLabel}` : "Rollback"}
                      size="small"
                      sx={softChip(tokens.warning)}
                    />
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
                  Binary {row.appVersion || "—"} · {formatDateTime(row.uploadTime)}
                  <Box
                    component="span"
                    sx={{ color: tokens.textMuted, display: { xs: "none", sm: "inline" } }}
                  >
                    {" "}({formatRelative(row.uploadTime)})
                  </Box>
                </Typography>
                {row.description && (
                  <Typography variant="body2" sx={{ color: tokens.textMuted, overflowWrap: "anywhere" }}>
                    {row.description}
                  </Typography>
                )}
              </Box>

              {/* Numbers: own columns on md+, a compact 4-up grid on small screens */}
              <Box
                sx={{
                  display: { xs: "grid", md: "contents" },
                  gridArea: "nums",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 1,
                }}
              >
                {cells.map((c) => (
                  <Box
                    key={c.label}
                    sx={{
                      textAlign: { xs: "left", md: "right" },
                      fontVariantNumeric: "tabular-nums",
                      color: c.color || tokens.textPrimary,
                      fontSize: 14,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ display: { xs: "block", md: "none" }, fontSize: 11, color: tokens.textMuted }}
                    >
                      {c.label}
                    </Box>
                    {c.value}
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  gridArea: { xs: "edit", md: "auto" },
                  alignSelf: { xs: "start", md: "center" },
                  textAlign: "right",
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(row)}
                  aria-label={`Edit ${row.label}`}
                  sx={{ borderColor: tokens.border, color: tokens.accentSoft }}
                >
                  Edit
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>

      {total > ROWS_COLLAPSED && (
        <Box sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${tokens.border}` }}>
          <Button
            size="small"
            onClick={onToggleShowAll}
            aria-expanded={showAll}
            sx={{ color: tokens.accentSoft }}
          >
            {showAll ? "Show fewer" : `Show all ${total} releases`}
          </Button>
        </Box>
      )}
    </SurfaceCard>
  );
};

export default DeploymentTable;
