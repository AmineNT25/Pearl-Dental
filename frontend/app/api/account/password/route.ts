import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError, ApiError, checkOrigin } from "@/lib/http";
import { getDatabase } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/password";
import { passwordSchema } from "@/lib/validation";
import type { StoredUser } from "@/lib/types";
export async function POST(request: Request) {
  try {
    const user = await requireUser(undefined, true); checkOrigin(request);
    const data = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema }).strict().parse(await request.json());
    if (data.currentPassword === data.newPassword) throw new ApiError(400, "Choose a different password.");
    const users = (await getDatabase()).collection<StoredUser>("users");
    const stored = await users.findOne({ id: user.id, active: true });
    if (!stored || !(await verifyPassword(data.currentPassword, stored.passwordHash))) throw new ApiError(400, "Your current password is incorrect.");
    const result = await users.updateOne({ id: user.id, active: true, passwordHash: stored.passwordHash }, { $set: { passwordHash: await hashPassword(data.newPassword), mustChangePassword: false }, $inc: { authVersion: 1 } });
    if (!result.modifiedCount) throw new ApiError(409, "Your account changed. Please sign in again.");
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}
