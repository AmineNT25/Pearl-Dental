import type { ClinicUser } from "@/lib/types";
declare module "next-auth" {
  interface Session { user?: ClinicUser; }
  interface User { authVersion: number; }
}
declare module "next-auth/jwt" { interface JWT { authVersion?: number; } }
