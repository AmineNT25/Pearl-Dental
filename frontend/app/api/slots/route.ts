import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { buildSlots, providers, services } from "@/lib/data";
import { listAppointments, readSchedule } from "@/lib/repository";
import { dateSchema } from "@/lib/validation";
export async function GET(request: Request) {
  try {
    await requireUser();
    const params = new URL(request.url).searchParams;
    const date = dateSchema.parse(params.get("date"));
    const providerId = z.string().refine((id) => providers.some((item) => item.id === id)).parse(params.get("providerId"));
    const serviceId = z.string().refine((id) => services.some((item) => item.id === id)).parse(params.get("serviceId"));
    return NextResponse.json({ slots: buildSlots(date, providerId, serviceId, await listAppointments(), "", await readSchedule()) });
  } catch (error) { return apiError(error); }
}
