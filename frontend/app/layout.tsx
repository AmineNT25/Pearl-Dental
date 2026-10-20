import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Pearl Dental | Clinic Workspace", description: "Manage your clinic team, appointments, schedules, and attendance.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
