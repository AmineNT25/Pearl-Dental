import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Dashboard from "@/components/clinic-dashboard";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  let session;
  try { session = await getServerSession(authOptions); }
  catch { return <main className="service-message"><h1>The clinic is temporarily unavailable</h1><p>Please check the database connection, then try again.</p><Link href="/">Try again</Link></main>; }
  if (!session?.user) redirect("/staff/login");
  if (session.user.mustChangePassword) redirect("/account/password");
  return <Dashboard user={session.user}/>;
}
