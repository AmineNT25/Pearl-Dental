import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PasswordForm from "@/components/password-form";
export const dynamic = "force-dynamic";
export default async function PasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/staff/login");
  return <PasswordForm required={session.user.mustChangePassword}/>;
}
