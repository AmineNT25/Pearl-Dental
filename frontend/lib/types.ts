export type AppointmentStatus = "pending" | "confirmed" | "checked_in" | "complete" | "cancelled";

export type Service = { id: string; name: string; duration: number; price: string; description: string };
export type Provider = { id: string; name: string; role: string };
export type DaySchedule = { enabled: boolean; open: string; close: string; breakStart: string; breakEnd: string };
export type Schedule = Record<string, DaySchedule>;

export type Appointment = {
  id: string;
  patientName: string;
  phone: string;
  email: string;
  serviceId: string;
  providerId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
};

export type Slot = { time: string; available: boolean };

export type UserRole = "admin" | "employee";
export type ClinicUser = {
  id: string; name: string; email: string; phone: string; jobTitle: string;
  role: UserRole; active: boolean; mustChangePassword: boolean; createdAt: string;
};
export type StoredUser = ClinicUser & { passwordHash: string; authVersion: number };
export type Attendance = {
  id: string; userId: string; date: string; status: "present" | "checked_out" | "absent";
  checkIn: string | null; checkOut: string | null; reason: string; updatedAt: string;
};
export type AttendanceAction = "check_in" | "check_out" | "absent";
