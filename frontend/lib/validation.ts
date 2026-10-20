import { z } from "zod";
import { providers, scheduleDays, services } from "@/lib/data";
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T12:00:00Z`);
  return !isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Choose a valid date.");
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const passwordSchema = z.string().min(12, "Use at least 12 characters.").max(128);
export const employeeSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email().max(254), phone: z.string().trim().max(40).default(""), jobTitle: z.string().trim().min(2).max(80) }).strict();
export const appointmentSchema = z.object({
  patientName: z.string().trim().min(2).max(100), phone: z.string().trim().min(7).max(40), email: z.string().trim().email().max(254),
  serviceId: z.string().refine((id) => services.some((item) => item.id === id)), providerId: z.string().refine((id) => providers.some((item) => item.id === id)),
  date: dateSchema, time: timeSchema, notes: z.string().trim().max(1000).default(""),
}).strict();
const daySchema = z.object({ enabled: z.boolean(), open: timeSchema, close: timeSchema, breakStart: timeSchema, breakEnd: timeSchema }).strict().refine((day) => !day.enabled || (
  day.open < day.close && (day.breakStart === day.breakEnd || (day.breakStart >= day.open && day.breakStart < day.breakEnd && day.breakEnd <= day.close))
), "Opening, closing, and break times must be in order.");
export const scheduleSchema = z.object(Object.fromEntries(scheduleDays.map((day) => [day, daySchema]))).strict();
export const attendanceSchema = z.object({ action: z.enum(["check_in", "check_out", "absent"]), date: dateSchema.optional(), reason: z.string().trim().max(500).default("") }).strict().refine((value) => value.action !== "absent" || value.reason.length >= 2, "Please give a reason for your absence.");
