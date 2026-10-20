import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, ApiError, checkOrigin } from "@/lib/http";
import { getDatabase } from "@/lib/mongodb";
import { publicUser } from "@/lib/users";
import { employeeSchema } from "@/lib/validation";
import type { StoredUser } from "@/lib/types";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    await requireUser("admin"); checkOrigin(request);
    const { id } = await context.params;
    const data = employeeSchema.parse(await request.json());
    const user = await (await getDatabase()).collection<StoredUser>("users").findOneAndUpdate({ id, role: "employee", active: true }, { $set: data, $inc: { authVersion: 1 } }, { returnDocument: "after" });
    if (!user) throw new ApiError(404, "Employee not found.");
    return NextResponse.json({ employee: publicUser(user) });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await requireUser("admin"); checkOrigin(request);
    const { id } = await context.params;
    const result = await (await getDatabase()).collection<StoredUser>("users").updateOne({ id, role: "employee", active: true }, { $set: { active: false }, $inc: { authVersion: 1 } });
    if (!result.matchedCount) throw new ApiError(404, "Employee not found.");
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}
