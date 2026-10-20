import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, checkOrigin } from "@/lib/http";
import { getDatabase } from "@/lib/mongodb";
import { hashPassword, temporaryPassword } from "@/lib/password";
import { publicUser } from "@/lib/users";
import { employeeSchema } from "@/lib/validation";
import type { StoredUser } from "@/lib/types";

export async function GET() {
  try {
    await requireUser("admin");
    const users = await (await getDatabase()).collection<StoredUser>("users").find({ role: "employee", active: true }).sort({ name: 1 }).toArray();
    return NextResponse.json({ employees: users.map(publicUser) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    await requireUser("admin"); checkOrigin(request);
    const data = employeeSchema.parse(await request.json());
    const password = temporaryPassword();
    const user: StoredUser = { ...data, id: crypto.randomUUID(), role: "employee", active: true, mustChangePassword: true, createdAt: new Date().toISOString(), authVersion: 1, passwordHash: await hashPassword(password) };
    await (await getDatabase()).collection<StoredUser>("users").insertOne(user);
    return NextResponse.json({ employee: publicUser(user), temporaryPassword: password }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
