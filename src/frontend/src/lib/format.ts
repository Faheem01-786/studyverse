import type { Timestamp } from "@/backend";

/** Format an XP amount with thousands separators, e.g. 1240 -> "1,240". */
export function formatXp(xp: bigint | number): string {
  const value = typeof xp === "bigint" ? Number(xp) : xp;
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-IN");
}

/** Compact XP label with the XP suffix, e.g. "1,240 XP". */
export function formatXpLabel(xp: bigint | number): string {
  return `${formatXp(xp)} XP`;
}

/** Roman-numeral-free level label, e.g. "Level 12". */
export function formatLevel(level: bigint | number): string {
  const value = typeof level === "bigint" ? Number(level) : level;
  return `Level ${Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1}`;
}

/** Convert a backend nanosecond timestamp to a Date, or null when invalid. */
export function timestampToDate(timestamp: Timestamp | undefined): Date | null {
  if (timestamp === undefined) return null;
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Human date, e.g. "12 Mar 2026". */
export function formatDate(timestamp: Timestamp | undefined): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Human date and time, e.g. "12 Mar 2026, 4:30 PM". */
export function formatDateTime(timestamp: Timestamp | undefined): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative day label for a day key, e.g. "Today" or "12 Mar". */
export function formatDayKey(dayKey: string | undefined): string {
  if (!dayKey) return "—";
  const parsed = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dayKey;
  const today = new Date();
  const isToday =
    parsed.getFullYear() === today.getFullYear() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getDate() === today.getDate();
  if (isToday) return "Today";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Format a minute count as "2h 15m" / "45m". */
export function formatMinutes(minutes: bigint | number): string {
  const value = typeof minutes === "bigint" ? Number(minutes) : minutes;
  const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Format a second count as a clock, e.g. "01:24:09" or "24:09". */
export function formatDuration(seconds: bigint | number): string {
  const value = typeof seconds === "bigint" ? Number(seconds) : seconds;
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

/** Format a rupee amount, e.g. 99 -> "₹99". */
export function formatRupees(rupees: bigint | number): string {
  const value = typeof rupees === "bigint" ? Number(rupees) : rupees;
  if (!Number.isFinite(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** Percentage of progress toward a target, clamped to 0-100. */
export function progressPercent(
  progress: bigint | number,
  target: bigint | number,
): number {
  const p = typeof progress === "bigint" ? Number(progress) : progress;
  const t = typeof target === "bigint" ? Number(target) : target;
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((p / t) * 100)));
}

/** Initials for an avatar fallback, e.g. "Aarav Sharma" -> "AS". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
