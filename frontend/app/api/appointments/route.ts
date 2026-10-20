import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, ApiError, checkOrigin } from "@/lib/http";
import { insertAppointment, listAppointments } from "@/lib/repository";
import { appointmentSchema } from "@/lib/validation";
import { clinicDate } from "@/lib/clinic-time";
import type { Appointment } from "@/lib/types";
export async function GET() {
  try { await requireUser(); return NextResponse.json({ appointments: await listAppointments() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    await requireUser("admin"); checkOrigin(request);
    const data = appointmentSchema.parse(await request.json());
    if (data.date < clinicDate()) throw new ApiError(400, "Choose today or a future date.");
    const appointment: Appointment = { ...data, id: crypto.randomUUID(), status: "pending", createdAt: new Date().toISOString() };
    await insertAppointment(appointment);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) { return apiError(error); }
}
