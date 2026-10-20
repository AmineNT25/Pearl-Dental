import type { Appointment, DaySchedule, Provider, Schedule, Service } from "@/lib/types";

export const services: Service[] = [
  { id: "cleaning", name: "Cleaning and exam", duration: 45, price: "$95", description: "Preventive hygiene visit with oral exam." },
  { id: "whitening", name: "Whitening consult", duration: 30, price: "$65", description: "Shade review and treatment planning." },
  { id: "filling", name: "Composite filling", duration: 60, price: "$180", description: "Restorative care for small to medium cavities." },
  { id: "emergency", name: "Emergency visit", duration: 30, price: "$120", description: "Pain, swelling, broken tooth, or urgent concern." },
  { id: "implant", name: "Implant consult", duration: 60, price: "$150", description: "Surgical assessment and digital treatment plan." },
];

export const providers: Provider[] = [
  { id: "dr-amani", name: "Dr. Lina Amani", role: "General dentist" },
  { id: "dr-hale", name: "Dr. Noah Hale", role: "Restorative dentist" },
  { id: "hyg-maya", name: "Maya Chen", role: "Dental hygienist" },
];

export const scheduleDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const defaultSchedule: Schedule = {
  Monday: { enabled: true, open: "08:30", close: "17:00", breakStart: "12:30", breakEnd: "13:30" },
  Tuesday: { enabled: true, open: "08:30", close: "17:00", breakStart: "12:30", breakEnd: "13:30" },
  Wednesday: { enabled: true, open: "09:00", close: "18:00", breakStart: "13:00", breakEnd: "14:00" },
  Thursday: { enabled: true, open: "08:30", close: "17:00", breakStart: "12:30", breakEnd: "13:30" },
  Friday: { enabled: true, open: "08:30", close: "16:00", breakStart: "12:30", breakEnd: "13:30" },
  Saturday: { enabled: true, open: "09:00", close: "13:00", breakStart: "00:00", breakEnd: "00:00" },
  Sunday: { enabled: false, open: "09:00", close: "13:00", breakStart: "00:00", breakEnd: "00:00" },
};

export function makeSeedAppointments(): Appointment[] {
  const today = new Date();
  const date = (offset: number) => {
    const value = new Date(today);
    value.setDate(value.getDate() + offset);
    return value.toISOString().slice(0, 10);
  };
  return [
    { id: "seed-mina", patientName: "Mina Roberts", phone: "(555) 010-3822", email: "mina.roberts@example.com", serviceId: "cleaning", providerId: "hyg-maya", date: date(0), time: "09:00", status: "confirmed", notes: "Routine six-month cleaning.", createdAt: new Date().toISOString() },
    { id: "seed-adam", patientName: "Adam Perez", phone: "(555) 013-4408", email: "adam.perez@example.com", serviceId: "emergency", providerId: "dr-amani", date: date(0), time: "11:30", status: "pending", notes: "Sharp pain on lower molar.", createdAt: new Date().toISOString() },
    { id: "seed-sofia", patientName: "Sofia Lane", phone: "(555) 016-9302", email: "sofia.lane@example.com", serviceId: "implant", providerId: "dr-hale", date: date(1), time: "10:00", status: "confirmed", notes: "Implant consultation and imaging.", createdAt: new Date().toISOString() },
  ];
}

export function getService(id: string) { return services.find((service) => service.id === id) ?? services[0]; }
export function getProvider(id: string) { return providers.find((provider) => provider.id === id) ?? providers[0]; }
export function timeToMinutes(time: string) { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; }
export function minutesToTime(minutes: number) { return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; }
export function dayName(date: string) { return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(`${date}T00:00:00`).getDay()]; }

export function buildSlots(date: string, providerId: string, serviceId: string, appointments: Appointment[], currentId = "", currentSchedule: Schedule = defaultSchedule) {
  const day = currentSchedule[dayName(date)];
  if (!day?.enabled) return [];
  const duration = getService(serviceId).duration;
  const open = timeToMinutes(day.open);
  const close = timeToMinutes(day.close);
  const breakStart = timeToMinutes(day.breakStart);
  const breakEnd = timeToMinutes(day.breakEnd);
  const overlap = (a: number, b: number, c: number, d: number) => a < d && c < b;
  const slots: { time: string; available: boolean }[] = [];
  for (let start = open; start + duration <= close; start += 30) {
    const blockedByBreak = breakEnd > breakStart && overlap(start, start + duration, breakStart, breakEnd);
    const blockedByAppointment = appointments.some((appointment) => {
      if (appointment.id === currentId || appointment.providerId !== providerId || appointment.date !== date || appointment.status === "cancelled") return false;
      return overlap(start, start + duration, timeToMinutes(appointment.time), timeToMinutes(appointment.time) + getService(appointment.serviceId).duration);
    });
    slots.push({ time: minutesToTime(start), available: !blockedByBreak && !blockedByAppointment });
  }
  return slots;
}

export function normaliseSchedule(value: unknown): Schedule {
  if (!value || typeof value !== "object") return defaultSchedule;
  const output = { ...defaultSchedule };
  for (const key of scheduleDays) {
    const candidate = (value as Record<string, Partial<DaySchedule>>)[key];
    if (candidate) output[key] = { ...defaultSchedule[key], ...candidate };
  }
  return output;
}
