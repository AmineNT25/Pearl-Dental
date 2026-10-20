import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, ApiError, checkOrigin } from "@/lib/http";
import { getDatabase } from "@/lib/mongodb";
import { hashPassword, temporaryPassword } from "@/lib/password";
import type { StoredUser } from "@/lib/types";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser("admin"); checkOrigin(request);
    const { id } = await params;
    const password = temporaryPassword();
    const user = await (await getDatabase()).collection<StoredUser>("users").findOneAndUpdate({ id, role: "employee", active: true }, { $set: { passwordHash: await hashPassword(password), mustChangePassword: true }, $inc: { authVersion: 1 } }, { returnDocument: "after" });
    if (!user) throw new ApiError(404, "Employee not found.");
    return NextResponse.json({ email: user.email, temporaryPassword: password }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
