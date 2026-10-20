import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { ZodError } from "zod";
import { DatabaseUnavailable } from "@/lib/mongodb";
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Invalid form values." }, { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  if (error instanceof DatabaseUnavailable) return NextResponse.json({ error: error.message }, { status: 503 });
  if (error instanceof MongoServerError && error.code === 11000) return NextResponse.json({ error: "This record already exists. Refresh and try again." }, { status: 409 });
  return NextResponse.json({ error: "The request could not be completed. Please try again." }, { status: 500 });
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXTAUTH_URL || request.url).origin;
  if (origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "This request is not allowed.");
}
