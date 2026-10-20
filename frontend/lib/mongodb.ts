import { MongoClient, type Db } from "mongodb";

const cache = globalThis as typeof globalThis & { dentalMongo?: Promise<MongoClient>; dentalIndexes?: Promise<void> };
export async function getMongoClient(): Promise<MongoClient> { await getDatabase(); return cache.dentalMongo!; }
export class DatabaseUnavailable extends Error {
  constructor() { super("The clinic database is unavailable. Please contact your administrator."); }
}
export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("username:password")) throw new DatabaseUnavailable();
  try {
    if (!cache.dentalMongo) {
      const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
      cache.dentalMongo = client.connect().catch(async () => { cache.dentalMongo = undefined; await client.close(); throw new DatabaseUnavailable(); });
    }
    const db = (await cache.dentalMongo).db(process.env.MONGODB_DB || "pearl_dental");
    if (!cache.dentalIndexes) {
      cache.dentalIndexes = Promise.all([
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("users").createIndex({ id: 1 }, { unique: true }),
        db.collection("attendance").createIndex({ userId: 1, date: 1 }, { unique: true }),
        db.collection("appointments").createIndex({ id: 1 }, { unique: true }),
        db.collection("appointments").createIndex({ date: 1, providerId: 1 }),
        db.collection("settings").createIndex({ key: 1 }, { unique: true }),
        db.collection("login_attempts").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("login_attempts").createIndex({ key: 1 }, { unique: true }),
        db.collection("booking_locks").createIndex({ key: 1 }, { unique: true }),
      ]).then(() => undefined).catch((error) => { cache.dentalIndexes = undefined; throw error; });
    }
    await cache.dentalIndexes;
    return db;
  } catch { throw new DatabaseUnavailable(); }
}
