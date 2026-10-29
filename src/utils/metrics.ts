// Types and math for CodePush release metrics.
//
// What the server counts (per label, see code-push-server redis-manager):
// - installed: successful install reports. Cumulative, never goes down.
// - active:    devices whose current update is this label. Drops only when a
//              device moves to another label or rolls back. Uninstalls are never
//              reported, so on the latest release active is close to installed.
// - downloaded: separate fire-and-forget report, often lost -> under-reported.
// - failed:    rollbacks (update crashed, device reverted).
// Keys that are not labels (e.g. "3.22.9") are devices running the plain
// binary of that version with no update applied; they only have `active`.
// `rollout` is a release setting (% of devices allowed), not progress.

export interface Release {
  label: string;
  appVersion: string;
  description?: string;
  isDisabled: boolean;
  isMandatory: boolean;
  rollout: number | null;
  size?: number;
  releaseMethod?: string;
  originalLabel?: string;
  uploadTime: number;
  packageHash?: string;
  blobUrl?: string;
}

export interface LabelMetrics {
  active: number;
  downloaded?: number;
  failed?: number;
  installed?: number;
}

export type DeploymentMetrics = Record<string, LabelMetrics>;

export const FAILURE_WARN = 0.02; // > 2% rollbacks: warning
export const FAILURE_BAD = 0.05; // > 5% rollbacks: error

const LABEL_RE = /^v\d+$/;

export const labelNumber = (label: string): number => {
  const n = parseInt(String(label).replace(/^v/i, ""), 10);
  return isNaN(n) ? -1 : n;
};

// The server appends releases (oldest first) and always treats the LAST entry
// as the current release (rollback, patch without label, update checks).
export const getLatestRelease = (history: Release[] | null | undefined) =>
  history && history.length ? history[history.length - 1] : null;

// null / undefined / 100 all mean "every device is allowed".
export const effectiveRollout = (rollout: number | null | undefined) =>
  typeof rollout === "number" && rollout > 0 && rollout < 100 ? rollout : 100;

export const isStagedRollout = (rollout: number | null | undefined) =>
  typeof rollout === "number" && rollout > 0 && rollout < 100;

const nonNegative = (n: unknown): number =>
  typeof n === "number" && isFinite(n) && n > 0 ? n : 0;

export const metricsFor = (
  metrics: DeploymentMetrics | null | undefined,
  label: string
): LabelMetrics | null => (metrics && metrics[label]) || null;

// failed / (installed + failed). null when nothing was reported.
export const failureRate = (m: LabelMetrics | null) => {
  if (!m) return null;
  const failed = nonNegative(m.failed);
  const attempts = nonNegative(m.installed) + failed;
  return attempts > 0 ? failed / attempts : null;
};

export const failureSeverity = (rate: number | null) =>
  rate === null ? "none" : rate > FAILURE_BAD ? "bad" : rate > FAILURE_WARN ? "warn" : "ok";

export interface AdoptionRow {
  key: string;
  label: string | null; // null = binary with no update
  release?: Release;
  active: number | null; // null = no reports for this label
  share: number | null;
  isLatest: boolean;
}

export interface Adoption {
  appVersion: string;
  latestActive: number;
  total: number;
  share: number | null;
  rows: AdoptionRow[]; // newest first, binary row last
  hasData: boolean;
  isRange: boolean; // appVersion like "2.x.x" or "^3.0.0"
}

// Share of devices on the same target binary that run the latest label:
//   active(latest) / sum(active of every label with the same appVersion
//                        + devices on that binary with no update)
export const computeAdoption = (
  history: Release[],
  metrics: DeploymentMetrics | null | undefined,
  latest: Release
): Adoption => {
  const appVersion = latest.appVersion;
  const sameBinary = history
    .filter((r) => r.appVersion === appVersion)
    .sort((a, b) => labelNumber(b.label) - labelNumber(a.label));

  const rows: AdoptionRow[] = sameBinary.map((release): AdoptionRow => {
    const m = metricsFor(metrics, release.label);
    return {
      key: release.label,
      label: release.label,
      release,
      active: m ? nonNegative(m.active) : null,
      share: null,
      isLatest: release.label === latest.label,
    };
  });

  const binary = !LABEL_RE.test(appVersion)
    ? metricsFor(metrics, appVersion)
    : null;
  if (binary) {
    rows.push({
      key: `binary-${appVersion}`,
      label: null,
      active: nonNegative(binary.active),
      share: null,
      isLatest: false,
    });
  }

  const total = rows.reduce((sum, r) => sum + (r.active ?? 0), 0);
  rows.forEach((r) => {
    r.share = total > 0 && r.active !== null ? r.active / total : null;
  });
  const latestActive = rows.find((r) => r.isLatest)?.active ?? 0;

  return {
    appVersion,
    latestActive,
    total,
    share: total > 0 ? latestActive / total : null,
    rows,
    hasData: rows.some((r) => r.active !== null),
    isRange: /[xX*^~<>|\s]/.test(appVersion),
  };
};
