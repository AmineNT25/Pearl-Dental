import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, ApiError, checkOrigin } from "@/lib/http";
import { getDatabase } from "@/lib/mongodb";
import { clinicDate, shiftDate } from "@/lib/clinic-time";
import { attendanceSchema, dateSchema } from "@/lib/validation";
import { attendanceChange } from "@/lib/attendance";
import type { Attendance } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const params = new URL(request.url).searchParams;
    const date = dateSchema.parse(params.get("date") || clinicDate());
    const history = params.get("history") === "true";
    const filter = { ...(user.role === "admin" && !history ? {} : { userId: user.id }), date: history ? { $gte: shiftDate(date, -30), $lte: shiftDate(date, 365) } : date };
    const attendance = await (await getDatabase()).collection<Attendance>("attendance").find(filter, { projection: { _id: 0 } }).sort({ date: -1 }).toArray();
    return NextResponse.json({ attendance }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await requireUser(); checkOrigin(request);
    const data = attendanceSchema.parse(await request.json());
    const date = data.date || clinicDate();
    const records = (await getDatabase()).collection<Attendance>("attendance");
    const current = await records.findOne({ userId: user.id, date });
    const changes = attendanceChange(current, data.action, date, data.reason);
    if (data.action === "check_out") {
      const attendance = await records.findOneAndUpdate({ userId: user.id, date, status: "present" }, { $set: changes }, { returnDocument: "after", projection: { _id: 0 } });
      if (!attendance) throw new ApiError(409, "Your attendance changed. Refresh and try again.");
      return NextResponse.json({ attendance });
    }
    const attendance = { id: crypto.randomUUID(), userId: user.id, date, ...changes } as Attendance;
    await records.insertOne({ ...attendance });
    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error) { return apiError(error); }
}
