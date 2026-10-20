import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { publicUser, userById } from "@/lib/users";
import { ApiError } from "@/lib/http";
import type { StoredUser } from "@/lib/types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [CredentialsProvider({
    name: "Clinic account",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password || credentials.password.length > 128 || credentials.email.length > 254) return null;
      if (!process.env.NEXTAUTH_SECRET) throw new Error("Clinic sign-in is not configured.");
      const email = credentials.email.trim().toLowerCase();
      const db = await getDatabase();
      const key = createHash("sha256").update(email).digest("hex");
      const attempts = db.collection<{ key: string; count: number; expiresAt: Date }>("login_attempts");
      await attempts.deleteOne({ key, expiresAt: { $lte: new Date() } });
      let attempt;
      try { attempt = await attempts.findOneAndUpdate({ key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 15 * 60 * 1000) } }, { upsert: true, returnDocument: "after" }); }
      catch { return null; }
      if (!attempt || attempt.count > 8) return null;
      const user = await db.collection<StoredUser>("users").findOne({ email, active: true });
      const hash = user?.passwordHash || `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;
      if (!(await verifyPassword(credentials.password, hash)) || !user) return null;
      await attempts.deleteOne({ key });
      return { ...publicUser(user), authVersion: user.authVersion };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.sub = user.id; token.authVersion = user.authVersion; }
      return token;
    },
    async session({ session, token }) {
      session.user = undefined;
      if (!token.sub) return session;
      const user = await userById(token.sub);
      if (user?.active && user.authVersion === token.authVersion) session.user = publicUser(user);
      return session;
    },
  },
  pages: { signIn: "/staff/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function requireUser(role?: "admin", allowPasswordChange = false) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new ApiError(401, "Please sign in to continue.");
  if (role && session.user.role !== role) throw new ApiError(403, "Administrator access is required.");
  if (session.user.mustChangePassword && !allowPasswordChange) throw new ApiError(403, "Change your temporary password before continuing.");
  return session.user;
}
