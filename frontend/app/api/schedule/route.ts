import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, checkOrigin } from "@/lib/http";
import { readSchedule, writeSchedule } from "@/lib/repository";
import { scheduleSchema } from "@/lib/validation";
import type { Schedule } from "@/lib/types";
export async function GET() {
  try { await requireUser(); return NextResponse.json({ schedule: await readSchedule() }); }
  catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    await requireUser("admin"); checkOrigin(request);
    const schedule = scheduleSchema.parse(await request.json()) as Schedule;
    return NextResponse.json({ schedule: await writeSchedule(schedule) });
  } catch (error) { return apiError(error); }
}
