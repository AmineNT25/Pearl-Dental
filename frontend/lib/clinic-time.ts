export const CLINIC_TIMEZONE = "Africa/Casablanca";
export function clinicDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}
export function clinicTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TIMEZONE, hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
export function dateLabel(date: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) {
  return new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
