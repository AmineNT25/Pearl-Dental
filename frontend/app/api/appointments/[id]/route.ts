import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, checkOrigin } from "@/lib/http";
import { updateAppointment } from "@/lib/repository";
import { z } from "zod";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser("admin"); checkOrigin(request);
    const data = z.object({ status: z.enum(["pending", "confirmed", "checked_in", "complete", "cancelled"]) }).strict().parse(await request.json());
    const { id } = await params;
    return NextResponse.json({ appointment: await updateAppointment(id, data.status) });
  } catch (error) { return apiError(error); }
}
