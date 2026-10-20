require("./register.cjs");
const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, verifyPassword, temporaryPassword } = require("../lib/password.ts");
const { attendanceChange } = require("../lib/attendance.ts");
const { employeeSchema, attendanceSchema, scheduleSchema, appointmentSchema, dateSchema } = require("../lib/validation.ts");
const { clinicDate } = require("../lib/clinic-time.ts");
const { checkOrigin } = require("../lib/http.ts");
const { publicUser } = require("../lib/users.ts");
const { defaultSchedule, buildSlots } = require("../lib/data.ts");

test("passwords are salted and checked without storing plaintext", async () => {
  const password = temporaryPassword();
  const first = await hashPassword(password); const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(await verifyPassword(password, "invalid-hash"), false);
});
test("public account data cannot disclose password hashes or authentication version", () => {
  const user = publicUser({ id: "e1", name: "Employee", email: "e@example.com", phone: "", jobTitle: "Assistant", role: "employee", active: true, mustChangePassword: true, createdAt: "", passwordHash: "private", authVersion: 1 });
  assert.equal("passwordHash" in user, false); assert.equal("authVersion" in user, false);
});
test("employee creation normalizes email and rejects role escalation", () => {
  const valid = { name: "New Employee", email: " NEW@EXAMPLE.COM ", phone: "", jobTitle: "Assistant" };
  assert.equal(employeeSchema.parse(valid).email, "new@example.com");
  assert.equal(employeeSchema.safeParse({ ...valid, role: "admin" }).success, false);
  assert.equal(attendanceSchema.safeParse({ action: "check_in", userId: "someone-else" }).success, false);
});
test("attendance enforces check-in then check-out and protects existing records", () => {
  const now = new Date("2026-10-17T08:00:00Z"); const date = clinicDate(now);
  const changes = attendanceChange(null, "check_in", date, "", now);
  const current = { id: "a1", userId: "e1", date, ...changes };
  assert.equal(changes.status, "present");
  assert.throws(() => attendanceChange(null, "check_out", date, "", now), /Check in/);
  assert.throws(() => attendanceChange(current, "check_in", date, "", now), /already/);
  assert.throws(() => attendanceChange(current, "absent", date, "Sick", now), /already/);
  const checkout = attendanceChange(current, "check_out", date, "", now);
  assert.equal(checkout.status, "checked_out");
  assert.throws(() => attendanceChange({ ...current, ...checkout }, "check_out", date, "", now), /Check in/);
});
test("absence dates and reasons are validated and clinic date uses Casablanca", () => {
  const now = new Date("2026-10-17T23:30:00Z");
  assert.equal(clinicDate(now), "2026-10-18");
  assert.throws(() => attendanceChange(null, "absent", "2026-10-17", "Sick", now), /Choose today/);
  assert.throws(() => attendanceChange(null, "check_in", "2026-10-19", "", now), /only available/);
  assert.throws(() => attendanceChange(null, "absent", "2026-10-19", "", now), /reason/);
  assert.equal(attendanceChange(null, "absent", "2026-10-19", "Annual leave", now).status, "absent");
  assert.equal(dateSchema.safeParse("2026-02-31").success, false);
});
test("schedules reject inverted hours and out-of-hours breaks", () => {
  assert.equal(scheduleSchema.safeParse(defaultSchedule).success, true);
  assert.equal(scheduleSchema.safeParse({ ...defaultSchedule, Monday: { ...defaultSchedule.Monday, close: "07:00" } }).success, false);
  assert.equal(scheduleSchema.safeParse({ ...defaultSchedule, Monday: { ...defaultSchedule.Monday, breakEnd: "19:00" } }).success, false);
  assert.equal(scheduleSchema.safeParse({ Monday: defaultSchedule.Monday }).success, false);
});
test("booking validates known providers/services and overlapping durations", () => {
  const data = { patientName: "Test Patient", phone: "0123456789", email: "patient@example.com", serviceId: "cleaning", providerId: "dr-amani", date: "2026-10-19", time: "08:30", notes: "" };
  assert.equal(appointmentSchema.safeParse({ ...data, providerId: "unknown" }).success, false);
  assert.equal(appointmentSchema.safeParse({ ...data, time: "25:00" }).success, false);
  const booked = { ...data, id: "booking", status: "confirmed", createdAt: "" };
  const slots = buildSlots(data.date, data.providerId, data.serviceId, [booked]);
  assert.equal(slots.find(s => s.time === "08:30").available, false);
  assert.equal(slots.find(s => s.time === "09:00").available, false);
  assert.equal(slots.find(s => s.time === "09:30").available, true);
});
test("cross-origin and originless mutations are refused", () => {
  const previous = process.env.NEXTAUTH_URL; process.env.NEXTAUTH_URL = "http://localhost:3000";
  try {
    assert.doesNotThrow(() => checkOrigin(new Request("http://localhost:3000/api/employees", { headers: { origin: "http://localhost:3000" } })));
    assert.throws(() => checkOrigin(new Request("http://localhost:3000/api/employees", { headers: { origin: "https://elsewhere.example" } })), /not allowed/);
    assert.throws(() => checkOrigin(new Request("http://localhost:3000/api/employees")), /not allowed/);
  } finally { if (previous === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = previous; }
});
test("server guards reject anonymous, employee admin access, and unchanged temporary passwords", async () => {
  const auth = require("../lib/auth.ts"); const nextAuth = require("next-auth/next");
  let session = null;
  const mocked = mock.method(nextAuth, "getServerSession", async () => session);
  try {
    await assert.rejects(auth.requireUser(), e => e.status === 401);
    session = { user: { id: "e1", role: "employee", mustChangePassword: false } };
    await assert.rejects(auth.requireUser("admin"), e => e.status === 403);
    assert.equal((await auth.requireUser()).id, "e1");
    session.user.mustChangePassword = true;
    await assert.rejects(auth.requireUser(), e => e.status === 403);
    assert.equal((await auth.requireUser(undefined, true)).id, "e1");
  } finally { mocked.mock.restore(); }
});
test("revoked or deactivated sessions do not expose a signed-in user", async () => {
  const { authOptions } = require("../lib/auth.ts"); const users = require("../lib/users.ts");
  let stored = { id: "e1", role: "employee", active: true, authVersion: 2 };
  const mocked = mock.method(users, "userById", async () => stored);
  try {
    assert.equal((await authOptions.callbacks.session({ session: { user: {} }, token: { sub: "e1", authVersion: 1 } })).user, undefined);
    stored.active = false;
    assert.equal((await authOptions.callbacks.session({ session: { user: {} }, token: { sub: "e1", authVersion: 2 } })).user, undefined);
  } finally { mocked.mock.restore(); }
});
test("all protected API routes reject anonymous requests before touching data", async () => {
  const nextAuth = require("next-auth/next");
  const mocked = mock.method(nextAuth, "getServerSession", async () => null);
  const routes = [
    ["employees/route", ["GET", "POST"]], ["employees/[id]/route", ["PATCH", "DELETE"]],
    ["employees/[id]/reset-password/route", ["POST"]], ["attendance/route", ["GET", "POST"]],
    ["appointments/route", ["GET", "POST"]], ["appointments/[id]/route", ["PATCH"]],
    ["schedule/route", ["GET", "PUT"]], ["slots/route", ["GET"]], ["account/password/route", ["POST"]],
  ];
  try {
    for (const [path, methods] of routes) {
      const route = require("../app/api/" + path + ".ts");
      for (const method of methods) {
        const response = await route[method](new Request("http://localhost:3000/api/test", { method, headers: { origin: "http://localhost:3000" } }), { params: Promise.resolve({ id: "test" }) });
        assert.equal(response.status, 401, path + " " + method);
      }
    }
  } finally { mocked.mock.restore(); }
});


test("employees cannot use any administrator mutation endpoint", async () => {
  const nextAuth = require("next-auth/next");
  const stub = mock.method(nextAuth, "getServerSession", async () => ({ user: { id: "e1", role: "employee", mustChangePassword: false } }));
  try {
    for (const [path, method] of [["employees/route","POST"],["employees/route","GET"],["employees/[id]/route","PATCH"],["employees/[id]/route","DELETE"],["employees/[id]/reset-password/route","POST"],["schedule/route","PUT"],["appointments/route","POST"],["appointments/[id]/route","PATCH"]]) {
      const response = await require("../app/api/" + path + ".ts")[method](new Request("http://localhost:3000/api/test", { method, headers: { origin: "http://localhost:3000" } }), { params: Promise.resolve({ id: "target" }) });
      assert.equal(response.status, 403, path + " " + method);
    }
  } finally { stub.mock.restore(); }
});
test("creating an employee creates a hashed login and returns the temporary password once", async () => {
  const auth = require("../lib/auth.ts"); const mongo = require("../lib/mongodb.ts"); let inserted;
  const guard = mock.method(auth, "requireUser", async role => { assert.equal(role, "admin"); return { id: "admin" }; });
  const database = mock.method(mongo, "getDatabase", async () => ({ collection: name => { assert.equal(name, "users"); return { insertOne: async user => { inserted = user; } }; } }));
  const previous = process.env.NEXTAUTH_URL; process.env.NEXTAUTH_URL = "http://localhost:3000";
  try {
    const response = await require("../app/api/employees/route.ts").POST(new Request("http://localhost:3000/api/employees", { method: "POST", headers: { origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ name: "Test Employee", email: "NEW@EXAMPLE.COM", phone: "", jobTitle: "Assistant" }) }));
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const data = await response.json();
    assert.equal(inserted.email, "new@example.com"); assert.equal(inserted.role, "employee");
    assert.equal(inserted.mustChangePassword, true);
    assert.equal(await verifyPassword(data.temporaryPassword, inserted.passwordHash), true);
    assert.equal("passwordHash" in data.employee, false);
  } finally { guard.mock.restore(); database.mock.restore(); if (previous === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = previous; }
});
test("attendance writes use the signed-in identity and employee reads stay scoped", async () => {
  const auth = require("../lib/auth.ts"); const mongo = require("../lib/mongodb.ts"); let inserted; let filter;
  const guard = mock.method(auth, "requireUser", async () => ({ id: "signed-in-employee", role: "employee" }));
  const database = mock.method(mongo, "getDatabase", async () => ({ collection: () => ({ findOne: async () => null, insertOne: async row => { inserted = row; }, find: query => { filter = query; return { sort: () => ({ toArray: async () => [] }) }; } }) }));
  const previous = process.env.NEXTAUTH_URL; process.env.NEXTAUTH_URL = "http://localhost:3000";
  try {
    const route = require("../app/api/attendance/route.ts");
    const response = await route.POST(new Request("http://localhost:3000/api/attendance", { method: "POST", headers: { origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ action: "check_in" }) }));
    assert.equal(response.status, 201); assert.equal(inserted.userId, "signed-in-employee");
    await route.GET(new Request("http://localhost:3000/api/attendance?userId=another-employee"));
    assert.equal(filter.userId, "signed-in-employee");
    const tampered = await route.POST(new Request("http://localhost:3000/api/attendance", { method: "POST", headers: { origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ action: "check_in", userId: "another-employee" }) }));
    assert.equal(tampered.status, 400);
  } finally { guard.mock.restore(); database.mock.restore(); if (previous === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = previous; }
});
test("a database failure returns 503 instead of a false successful account creation", async () => {
  const auth = require("../lib/auth.ts"); const mongo = require("../lib/mongodb.ts");
  const guard = mock.method(auth, "requireUser", async () => ({ id: "admin", role: "admin" }));
  const database = mock.method(mongo, "getDatabase", async () => { throw new mongo.DatabaseUnavailable(); });
  try { assert.equal((await require("../app/api/employees/route.ts").GET()).status, 503); }
  finally { guard.mock.restore(); database.mock.restore(); }
});
