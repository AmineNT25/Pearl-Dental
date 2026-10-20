import { clinicDate, shiftDate } from "@/lib/clinic-time";
import { ApiError } from "@/lib/http";
import type { Attendance, AttendanceAction } from "@/lib/types";

export function attendanceChange(current: Attendance | null, action: AttendanceAction, date: string, reason: string, now = new Date()): Partial<Attendance> {
  const today = clinicDate(now);
  if (date < today || date > shiftDate(today, 365)) throw new ApiError(400, "Choose today or a date within the next year.");
  if (action !== "absent" && date !== today) throw new ApiError(400, "Check-in and check-out are only available for today.");
  if (action === "check_out") {
    if (current?.status !== "present") throw new ApiError(409, "Check in before checking out.");
    return { status: "checked_out", checkOut: now.toISOString(), updatedAt: now.toISOString() };
  }
  if (current) throw new ApiError(409, "Attendance has already been recorded for this date.");
  if (action === "absent" && reason.trim().length < 2) throw new ApiError(400, "Please give a reason for your absence.");
  return { status: action === "absent" ? "absent" : "present", checkIn: action === "check_in" ? now.toISOString() : null, checkOut: null, reason: action === "absent" ? reason.trim() : "", updatedAt: now.toISOString() };
}
