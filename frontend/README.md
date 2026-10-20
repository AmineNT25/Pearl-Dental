# Pearl Dental clinic workspace

A Next.js App Router application with a dashboard adapted from the supplied Figma Make design. The UI uses the existing Pearl Dental branding.

## Included

- A shared sign-in page with server-enforced administrator and employee permissions.
- Admin employee creation creates a login immediately, using the employee's email and a generated temporary password. The password appears once in the admin dialog. The employee must replace it before entering the workspace.
- Admins can edit employees, reset passwords, and deactivate accounts. Editing, password changes/resets, and deactivation invalidate existing sessions. Deactivation retains attendance history.
- Employees can check in, check out, report a dated absence with a reason, and read their attendance history, clinic schedule, and appointments.
- Admins can create appointments, change appointment statuses, and edit clinic opening hours.
- MongoDB stores users, attendance, appointments, clinic settings, and login throttling records. There is no in-memory persistence fallback.

## MongoDB Atlas setup

This workspace was connected on October 20, 2026 to **Pearl Dental / Cluster0** (Atlas Free), using the `pearl_dental` database. The application database user has `readWrite` access only to that database. `.env.local` contains the connection string and authentication secret and is ignored by version control. Atlas currently allows this development machine's public IP; update the access list if that IP changes.

The initial administrator is `admin@pearl.com`. Its temporary password is in the local, ignored `.qa/admin-login.txt` file. The first sign-in requires a new password. Delete that file after choosing your password. The steps below are for setting up another environment; do not bootstrap a second administrator in this configured database.

1. Use the MongoDB Atlas plugin to create or select an Atlas project and an M0 free cluster. If an existing project already uses its free-cluster allowance, decide which existing cluster to use before choosing a paid tier.
2. Create a database user limited to `readWrite` on the `pearl_dental` database.
3. Allow the development machine's current public IP in the Atlas network access list. Add the deployment server's egress IP when deploying.
4. Run `npm run setup`. This creates an ignored `.env.local` with a cryptographically random authentication secret; it preserves an existing file.
5. Set `MONGODB_URI` in `.env.local` to the Atlas Node.js connection string, including the database user's URL-encoded credentials. Set `MONGODB_DB=pearl_dental`.
6. Run `npm run admin:create` from this directory. It prompts for the initial administrator's name, email, and password; the password is hidden in an interactive terminal. This command refuses to overwrite an existing administrator. Use Node.js 24 or newer for the setup command.
7. Run `npm run dev` and sign in at [http://localhost:3000/staff/login](http://localhost:3000/staff/login).

No hard-coded administrator account or public registration endpoint exists. Do not commit `.env.local`. Use HTTPS and set `NEXTAUTH_URL` to the actual application origin when deploying.

For Atlas instructions, see [connect an application](https://www.mongodb.com/docs/atlas/driver-connection/) and [network access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## Account workflow

1. Sign in as the administrator and open **Employees > Add employee**.
2. Enter the employee's name, email, job title, and optional phone number.
3. Privately share the generated login details. The app does not email passwords.
4. The employee signs in at the same URL and replaces the temporary password.
5. **My attendance** records arrival/departure using server timestamps. Absence dates can be today or within the next year. Attendance is unique per person per date; an existing attendance record cannot be overwritten through the employee endpoint.
6. Employees can read appointments and the weekly schedule. Only admins can change them.

Clinic dates and displayed attendance times use `Africa/Casablanca`. A daily attendance record supports one arrival and one departure. The current provider/service catalog is in `lib/data.ts`; employee job titles do not automatically add a booking provider.

## API access

| Endpoint | Access |
| --- | --- |
| `GET /api/appointments`, `GET /api/schedule`, `GET /api/slots` | Signed-in users with a changed password |
| `POST /api/appointments`, `PATCH /api/appointments/:id`, `PUT /api/schedule` | Admin |
| `GET/POST /api/employees` | Admin |
| `PATCH/DELETE /api/employees/:id` | Admin; DELETE deactivates |
| `POST /api/employees/:id/reset-password` | Admin |
| `GET /api/attendance?date=YYYY-MM-DD` | Admin: daily team records; employee: own records |
| `GET /api/attendance?history=true` | Own last 30 days plus upcoming absences |
| `POST /api/attendance` | Own attendance only; identity comes from the session |
| `POST /api/account/password` | Signed-in user, including a temporary-password session |

Custom mutation routes check the request Origin; authentication routes use NextAuth's CSRF protection. Password hashes use salted scrypt. Login attempts are limited to eight per email within 15 minutes. Sessions last eight hours and are checked against the current active user and authentication version on each protected request.

Unique indexes protect email addresses and daily attendance. Appointment creation/status changes and schedule writes run through MongoDB transactions with a shared booking lock document to serialize conflict checks. Atlas supports the required transactions. Database failures return errors instead of reporting a successful unsaved change.

## Validation

```sh
npm test
npm run typecheck
npm run build -- --no-lint
```

The 15 automated tests cover password hashing, role restrictions, account serialization and creation, attendance validation and ownership, schedule validation, slot overlap, session revocation, and database-failure responses. Route tests use isolated database doubles.

Live verification against Atlas on October 20, 2026 also passed: administrator and employee sign-in, browser employee creation, mandatory password replacement, check-in/check-out, dated absence, employee schedule visibility, browser appointment creation, conflicting-booking rejection, schedule persistence, password reset, account deactivation, and session revocation. The synthetic accounts, attendance, and appointments were removed after verification. TypeScript checks passed.

The original dashboard is retained in `components/dashboard.tsx`; the active workspace is `components/clinic-dashboard.tsx`. The original standalone `index.html`/`app.js` files are not served by Next.js.

Authentication follows the [NextAuth credentials](https://next-auth.js.org/providers/credentials) and [server session](https://next-auth.js.org/configuration/nextjs) APIs.
