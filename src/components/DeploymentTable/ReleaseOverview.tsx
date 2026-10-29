import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import TuneIcon from "@mui/icons-material/Tune";
import { alpha } from "@mui/material/styles";
import { tokens, softChip } from "../../theme";
import { SurfaceCard, Overline } from "../common/ui";
import {
  Release,
  DeploymentMetrics,
  AdoptionRow,
  computeAdoption,
  metricsFor,
  failureRate,
  failureSeverity,
  effectiveRollout,
  isStagedRollout,
  FAILURE_WARN,
} from "../../utils/metrics";
import {
  formatInt,
  formatPercent,
  formatDate,
  formatDateTime,
  formatRelative,
  formatBytes,
} from "../../utils/format";

export type LoadStatus = "loading" | "ready" | "error";

interface ReleaseOverviewProps {
  latest: Release;
  history: Release[];
  metrics: DeploymentMetrics | null;
  metricsStatus: LoadStatus;
  onRetryMetrics: () => void;
  onEdit: () => void;
}

// Colors for the adoption bar. Latest is always the accent color; the next
// few releases get their own color, older ones are grouped.
const OTHER_COLORS = ["#4fc3f7", "#f48fb1", "#ffd54f", "#4db6ac"];
const GROUPED_COLOR = "#8d8aa8";
const BINARY_COLOR = "#5d5b78";
const ROWS_COLLAPSED = 5;

const rowColor = (row: AdoptionRow, index: number) => {
  if (row.isLatest) return tokens.accent;
  if (row.label === null) return BINARY_COLOR;
  return index >= 1 && index <= OTHER_COLORS.length
    ? OTHER_COLORS[index - 1]
    : GROUPED_COLOR;
};

const severityColor = {
  none: tokens.textPrimary,
  ok: tokens.success,
  warn: tokens.warning,
  bad: tokens.error,
} as const;

/* ---------- Adoption ---------- */

const AdoptionCard: React.FC<{
  latest: Release;
  history: Release[];
  metrics: DeploymentMetrics | null;
}> = ({ latest, history, metrics }) => {
  const [expanded, setExpanded] = useState(false);
  const adoption = computeAdoption(history, metrics, latest);
  const colored = adoption.rows.map((row, i) => ({ row, color: rowColor(row, i) }));

  // Bar segments; grouped "older releases" sit just before the binary segment.
  const segments: { key: string; name: string; share: number; color: string }[] = [];
  let groupedShare = 0;
  colored.forEach(({ row, color }) => {
    if (!row.share) return;
    if (color === GROUPED_COLOR) groupedShare += row.share;
    else
      segments.push({
        key: row.key,
        name: row.label ?? "No update (binary)",
        share: row.share,
        color,
      });
  });
  if (groupedShare > 0) {
    const grouped = {
      key: "grouped",
      name: "Older releases",
      share: groupedShare,
      color: GROUPED_COLOR,
    };
    const binaryIdx = segments.findIndex((s) => s.color === BINARY_COLOR);
    if (binaryIdx >= 0) segments.splice(binaryIdx, 0, grouped);
    else segments.push(grouped);
  }

  const visibleRows = expanded ? colored : colored.slice(0, ROWS_COLLAPSED);
  const canToggle = colored.length > ROWS_COLLAPSED;

  return (
    <SurfaceCard aria-label="Adoption">
      <Overline
        info={
          <>
            Share of devices on binary {adoption.appVersion} whose current
            update is {latest.label}.
            <br />
            Formula: active({latest.label}) ÷ active of all releases for{" "}
            {adoption.appVersion} (plus devices on that binary with no update).
            <br />
            Uninstalls are never reported, so counts only drop when a device
            moves to another release.
          </>
        }
        infoLabel="How adoption is calculated"
      >
        Adoption
      </Overline>

      {!adoption.hasData ? (
        <Box sx={{ py: 1 }}>
          <Typography variant="h4" component="p" sx={{ color: tokens.textMuted }}>
            —
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 0.5 }}>
            No device reports yet for binary {adoption.appVersion}. Adoption
            shows up once devices running it check in.
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              columnGap: 1.5,
              rowGap: 0.5,
            }}
          >
            <Typography
              variant="h3"
              component="p"
              sx={{ fontWeight: 800, color: tokens.accentSoft, lineHeight: 1.1 }}
            >
              {formatPercent(adoption.share)}
            </Typography>
            <Typography variant="body1">
              of devices on <b>{adoption.appVersion}</b> run <b>{latest.label}</b>
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 0.5 }}>
            {formatInt(adoption.latestActive)} of {formatInt(adoption.total)} devices
          </Typography>

          {/* Stacked bar */}
          <Box
            role="img"
            aria-label={
              segments.length
                ? segments.map((s) => `${s.name} ${formatPercent(s.share)}`).join(", ")
                : "No active devices"
            }
            sx={{
              display: "flex",
              height: 12,
              borderRadius: 6,
              overflow: "hidden",
              backgroundColor: tokens.surfaceRaised,
              mt: 2,
              mb: 1.5,
              gap: "2px",
            }}
          >
            {segments.map((s) => (
              <Tooltip key={s.key} title={`${s.name}: ${formatPercent(s.share)}`} arrow>
                <Box sx={{ width: `${s.share * 100}%`, minWidth: 3, backgroundColor: s.color }} />
              </Tooltip>
            ))}
          </Box>

          {/* Per-release breakdown for this binary, newest first */}
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              "& th": {
                textAlign: "left",
                fontWeight: 700,
                fontSize: 12,
                color: tokens.textMuted,
                pb: 0.5,
                borderBottom: `1px solid ${tokens.border}`,
              },
              "& td": {
                py: 0.75,
                fontSize: 14,
                borderBottom: `1px solid ${alpha(tokens.border, 0.5)}`,
                verticalAlign: "middle",
              },
              "& tbody tr:last-of-type td": { borderBottom: "none" },
              "& .num": {
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                pl: 1.5,
                whiteSpace: "nowrap",
              },
            }}
          >
            <caption style={{ position: "absolute", left: -9999 }}>
              Active devices per release for binary {adoption.appVersion}
            </caption>
            <thead>
              <tr>
                <th scope="col">Release</th>
                <th scope="col" className="num">Active</th>
                <th scope="col" className="num">Share</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ row, color }) => (
                <tr key={row.key}>
                  <td>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Box
                        aria-hidden
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "3px",
                          backgroundColor: color,
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                          <Typography component="span" sx={{ fontWeight: 700, fontSize: 14 }}>
                            {row.label ?? "No update"}
                          </Typography>
                          {row.isLatest && (
                            <Chip label="latest" size="small" sx={softChip(tokens.accentSoft)} />
                          )}
                          {row.release?.isDisabled && (
                            <Chip label="disabled" size="small" sx={softChip(tokens.error)} />
                          )}
                        </Box>
                        <Typography component="span" sx={{ display: "block", fontSize: 12, color: tokens.textMuted }}>
                          {row.release
                            ? `Released ${formatDate(row.release.uploadTime)}`
                            : "Store binary, no OTA update applied"}
                        </Typography>
                      </Box>
                    </Box>
                  </td>
                  <td className="num">{row.active === null ? "—" : formatInt(row.active)}</td>
                  <td className="num">{formatPercent(row.share)}</td>
                </tr>
              ))}
            </tbody>
          </Box>
          {canToggle && (
            <Button
              size="small"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              sx={{ mt: 1, color: tokens.accentSoft }}
            >
              {expanded ? "Show fewer" : `Show all ${colored.length} rows`}
            </Button>
          )}
          {adoption.isRange && (
            <Typography variant="caption" component="p" sx={{ color: tokens.textMuted, mt: 1 }}>
              Target {adoption.appVersion} is a version range, so devices on the
              plain binary (no update) are not counted here.
            </Typography>
          )}
        </>
      )}
    </SurfaceCard>
  );
};

/* ---------- Small stat card ---------- */

const StatCard: React.FC<{
  title: string;
  value: string;
  valueColor?: string;
  caption: React.ReactNode;
  info: React.ReactNode;
}> = ({ title, value, valueColor, caption, info }) => (
  <SurfaceCard aria-label={title}>
    <Overline info={info} infoLabel={`About ${title}`}>
      {title}
    </Overline>
    <Typography
      variant="h4"
      component="p"
      sx={{ color: valueColor || tokens.textPrimary, fontVariantNumeric: "tabular-nums" }}
    >
      {value}
    </Typography>
    <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 0.5 }}>
      {caption}
    </Typography>
  </SurfaceCard>
);

/* ---------- Settings ---------- */

const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "112px minmax(0, 1fr)",
      gap: 1.5,
      py: 1,
      borderBottom: `1px solid ${alpha(tokens.border, 0.6)}`,
      "&:last-of-type": { borderBottom: "none" },
    }}
  >
    <Typography component="dt" sx={{ fontSize: 13, color: tokens.textMuted, pt: "1px" }}>
      {label}
    </Typography>
    <Box component="dd" sx={{ m: 0, fontSize: 14, minWidth: 0, overflowWrap: "anywhere" }}>
      {children}
    </Box>
  </Box>
);

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography component="span" sx={{ display: "block", fontSize: 12, color: tokens.textMuted }}>
    {children}
  </Typography>
);

const SettingsCard: React.FC<{ latest: Release }> = ({ latest }) => {
  const staged = isStagedRollout(latest.rollout);
  return (
    <SurfaceCard muted aria-label="Release settings">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TuneIcon sx={{ fontSize: 18, color: tokens.textMuted }} />
        <Typography variant="overline" component="h3" sx={{ color: tokens.textMuted, fontSize: 12 }}>
          Release settings
        </Typography>
      </Box>
      <Typography variant="caption" component="p" sx={{ color: tokens.textMuted, mb: 1 }}>
        What was configured for {latest.label}. Settings, not measurements.
      </Typography>
      <Box component="dl" sx={{ m: 0 }}>
        <SettingRow label="Rollout">
          {effectiveRollout(latest.rollout)}% of devices allowed
          <Sub>{staged ? "Staged rollout in progress" : "Full release (no staged rollout)"}</Sub>
        </SettingRow>
        <SettingRow label="Mandatory">{latest.isMandatory ? "Yes" : "No"}</SettingRow>
        <SettingRow label="Status">
          {latest.isDisabled ? (
            <Chip label="Disabled" size="small" sx={softChip(tokens.error)} />
          ) : (
            <Chip label="Enabled" size="small" sx={softChip(tokens.success)} />
          )}
        </SettingRow>
        <SettingRow label="Target binary">{latest.appVersion || "—"}</SettingRow>
        <SettingRow label="Released">
          {formatDateTime(latest.uploadTime)}
          <Sub>{formatRelative(latest.uploadTime)}</Sub>
        </SettingRow>
        <SettingRow label="Release method">
          {latest.releaseMethod === "Rollback" && latest.originalLabel
            ? `Rollback (copy of ${latest.originalLabel})`
            : latest.releaseMethod || "—"}
        </SettingRow>
        <SettingRow label="Size">{formatBytes(latest.size)}</SettingRow>
        <SettingRow label="Description">
          {latest.description || (
            <Typography component="span" sx={{ fontSize: 14, color: tokens.textMuted }}>
              No description
            </Typography>
          )}
        </SettingRow>
        {latest.blobUrl && (
          <SettingRow label="Bundle">
            <a href={latest.blobUrl} target="_blank" rel="noopener noreferrer" style={{ color: tokens.info }}>
              Download bundle
            </a>
          </SettingRow>
        )}
      </Box>
    </SurfaceCard>
  );
};

/* ---------- Overview ---------- */

const ReleaseOverview: React.FC<ReleaseOverviewProps> = ({
  latest,
  history,
  metrics,
  metricsStatus,
  onRetryMetrics,
  onEdit,
}) => {
  const m = metricsFor(metrics, latest.label);
  const rate = failureRate(m);
  const severity = failureSeverity(rate);
  const failed = m?.failed ?? 0;
  const attempts = (m?.installed ?? 0) + failed;

  let metricsBody: React.ReactNode;
  if (metricsStatus === "loading") {
    metricsBody = (
      <Box sx={{ display: "grid", gap: 2 }} aria-busy="true" aria-label="Loading metrics">
        <Skeleton variant="rounded" height={220} />
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={120} />
        </Box>
      </Box>
    );
  } else if (metricsStatus === "error") {
    metricsBody = (
      <Alert
        severity="error"
        variant="outlined"
        action={
          <Button color="inherit" size="small" onClick={onRetryMetrics}>
            Retry
          </Button>
        }
      >
        Couldn't load metrics for this deployment.
      </Alert>
    );
  } else {
    metricsBody = (
      <Box sx={{ display: "grid", gap: 2, minWidth: 0 }}>
        <AdoptionCard latest={latest} history={history} metrics={metrics} />
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          <StatCard
            title="Failure rate"
            value={formatPercent(rate)}
            valueColor={severityColor[severity]}
            caption={
              m
                ? `${formatInt(failed)} rollback${failed === 1 ? "" : "s"} of ${formatInt(attempts)} install attempts`
                : "No reports yet"
            }
            info={
              <>
                Devices where {latest.label} crashed and the SDK rolled back to
                the previous version.
                <br />
                Formula: failed ÷ (installed + failed). Orange above{" "}
                {formatPercent(FAILURE_WARN)}.
              </>
            }
          />
          <StatCard
            title="Installs"
            value={m ? formatInt(m.installed ?? 0) : "—"}
            caption="Successful installs reported, total so far"
            info={
              <>
                Each successful install report for {latest.label}. It only goes
                up: it does not drop when a device moves on or uninstalls.
              </>
            }
          />
          <StatCard
            title="Downloads"
            value={m ? formatInt(m.downloaded ?? 0) : "—"}
            caption="May be under-reported"
            info={
              <>
                Download reports are fire-and-forget and often get lost
                (especially for mandatory / immediate installs), so this can be
                lower than installs.
              </>
            }
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box component="section" aria-label="Latest release" sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "flex-end" },
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" component="p" sx={{ color: tokens.textMuted, fontSize: 12 }}>
            Latest release
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h4" component="h2">
              {latest.label}
            </Typography>
            {latest.isDisabled && <Chip label="Disabled" size="small" sx={softChip(tokens.error)} />}
            {latest.isMandatory && <Chip label="Mandatory" size="small" sx={softChip(tokens.accentSoft)} />}
            {isStagedRollout(latest.rollout) && (
              <Chip label={`Rollout ${latest.rollout}%`} size="small" sx={softChip(tokens.info)} />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 0.25 }}>
            Binary {latest.appVersion} · released {formatRelative(latest.uploadTime)}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
          Edit release
        </Button>
      </Box>

      {latest.isDisabled && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          {latest.label} is disabled: devices won't receive it and stay on
          their current release.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: "minmax(0, 2fr) minmax(300px, 1fr)",
          },
          alignItems: "start",
        }}
      >
        {metricsBody}
        <SettingsCard latest={latest} />
      </Box>
    </Box>
  );
};

export default ReleaseOverview;
