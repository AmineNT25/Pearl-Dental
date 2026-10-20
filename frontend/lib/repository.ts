import { getDatabase, getMongoClient } from "@/lib/mongodb";
import { buildSlots, defaultSchedule, normaliseSchedule } from "@/lib/data";
import { ApiError } from "@/lib/http";
import type { Appointment, AppointmentStatus, Schedule } from "@/lib/types";
import type { ClientSession } from "mongodb";

export async function listAppointments(): Promise<Appointment[]> {
  return (await getDatabase()).collection<Appointment>("appointments").find({}, { projection: { _id: 0 } }).sort({ date: 1, time: 1 }).toArray();
}
export async function readSchedule(): Promise<Schedule> {
  const record = await (await getDatabase()).collection("settings").findOne({ key: "schedule" });
  return normaliseSchedule(record?.value ?? defaultSchedule);
}
async function withBookingWrite<T>(operation: (session: ClientSession) => Promise<T>): Promise<T> {
  const db = await getDatabase();
  const client = await getMongoClient();
  return client.withSession(async (session) => {
    const result = await session.withTransaction(async () => {
      // Every booking/status/schedule writer takes the same document lock.
      await db.collection("booking_locks").updateOne({ key: "clinic" }, { $inc: { revision: 1 } }, { upsert: true, session });
      return operation(session);
    });
    return result as T;
  });
}
export async function insertAppointment(appointment: Appointment) {
  const db = await getDatabase();
  return withBookingWrite(async (session) => {
    const appointments = await db.collection<Appointment>("appointments").find({}, { session }).toArray();
    const record = await db.collection("settings").findOne({ key: "schedule" }, { session });
    const slots = buildSlots(appointment.date, appointment.providerId, appointment.serviceId, appointments, "", normaliseSchedule(record?.value));
    if (!slots.some((slot) => slot.time === appointment.time && slot.available)) throw new ApiError(409, "That time is no longer available. Please choose another slot.");
    await db.collection<Appointment>("appointments").insertOne({ ...appointment }, { session });
    return appointment;
  });
}
export async function updateAppointment(id: string, status: AppointmentStatus) {
  const db = await getDatabase();
  return withBookingWrite(async (session) => {
    const collection = db.collection<Appointment>("appointments");
    const current = await collection.findOne({ id }, { session });
    if (!current) throw new ApiError(404, "Appointment not found.");
    if (current.status === "cancelled" && status !== "cancelled") {
      const appointments = await collection.find({}, { session }).toArray();
      const record = await db.collection("settings").findOne({ key: "schedule" }, { session });
      if (!buildSlots(current.date, current.providerId, current.serviceId, appointments, id, normaliseSchedule(record?.value)).some((slot) => slot.time === current.time && slot.available)) throw new ApiError(409, "That time has been booked by another patient.");
    }
    return collection.findOneAndUpdate({ id }, { $set: { status } }, { session, returnDocument: "after", projection: { _id: 0 } });
  });
}
export async function writeSchedule(schedule: Schedule) {
  const db = await getDatabase();
  return withBookingWrite(async (session) => {
    await db.collection("settings").updateOne({ key: "schedule" }, { $set: { value: schedule } }, { upsert: true, session });
    return schedule;
  });
}
