// Number / date formatting in the viewer's locale.

const intFormat = new Intl.NumberFormat();

export const formatInt = (n: number | null | undefined): string =>
  typeof n === "number" && isFinite(n) ? intFormat.format(n) : "—";

// 0.6123 -> "61.2%", 1 -> "100%", tiny but non-zero -> "<0.1%"
export const formatPercent = (ratio: number | null | undefined): string => {
  if (typeof ratio !== "number" || !isFinite(ratio)) return "—";
  if (ratio > 0 && ratio < 0.001) return "<0.1%";
  const pct = ratio * 100;
  const digits = pct >= 10 || Number.isInteger(pct) ? 0 : 1;
  return `${pct.toFixed(digits).replace(/\.0$/, "")}%`;
};

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const toDate = (value: number | string | null | undefined): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (value: number | string | null | undefined) => {
  const d = toDate(value);
  return d ? dateTimeFormat.format(d) : "—";
};

export const formatDate = (value: number | string | null | undefined) => {
  const d = toDate(value);
  return d ? dateFormat.format(d) : "—";
};

const relativeFormat = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

export const formatRelative = (value: number | string | null | undefined) => {
  const d = toDate(value);
  if (!d) return "";
  const seconds = (d.getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return relativeFormat.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
};

export const formatBytes = (bytes: number | null | undefined): string => {
  if (typeof bytes !== "number" || !isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};
