import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { getDatabase, getMongoClient } from "../lib/mongodb.ts";
import { hashPassword } from "../lib/password.ts";
import type { StoredUser } from "../lib/types.ts";

let muted = false;
const output = new Writable({ write(chunk, _encoding, callback) { if (!muted) process.stdout.write(chunk); callback(); } });
const prompt = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
let exitCode = 0;
try {
  if (!process.env.MONGODB_URI || !process.env.NEXTAUTH_SECRET) throw new Error("Run npm run setup, then configure MONGODB_URI in .env.local first.");
  const db = await getDatabase();
  const users = db.collection<StoredUser>("users");
  // Only this local bootstrap command creates the initial administrator.
  if (await users.findOne({ role: "admin" })) throw new Error("An administrator already exists. No account was changed.");
  const name = (await prompt.question("Administrator name: ")).trim();
  const email = (await prompt.question("Administrator email: ")).trim().toLowerCase();
  process.stdout.write("Password (12–128 characters; input hidden): ");
  muted = true;
  const password = await prompt.question("");
  muted = false;
  process.stdout.write("\n");
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128) throw new Error("Invalid name, email, or password. No account was created.");
  await users.insertOne({ id: "clinic-admin", name, email, phone: "", jobTitle: "Clinic administrator", role: "admin", active: true, mustChangePassword: false, authVersion: 1, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() });
  console.log("Administrator created. Sign in at http://localhost:3000/staff/login.");
} catch (error) {
  console.error(error instanceof Error && error.name !== "MongoServerError" ? error.message : "The administrator could not be created. Check the database connection and existing accounts.");
  exitCode = 1;
} finally {
  muted = false; prompt.close();
  if (process.env.MONGODB_URI) { try { await (await getMongoClient()).close(); } catch {} }
}
process.exit(exitCode);

