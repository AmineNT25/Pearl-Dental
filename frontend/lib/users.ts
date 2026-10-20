import { getDatabase } from "@/lib/mongodb";
import type { ClinicUser, StoredUser } from "@/lib/types";
export function publicUser(user: StoredUser): ClinicUser {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, jobTitle: user.jobTitle, role: user.role, active: user.active, mustChangePassword: user.mustChangePassword, createdAt: user.createdAt };
}
export async function userById(id: string) { return (await getDatabase()).collection<StoredUser>("users").findOne({ id }); }
