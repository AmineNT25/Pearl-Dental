import fs from "node:fs";
import { randomBytes } from "node:crypto";
const file = ".env.local";
if (fs.existsSync(file)) {
  console.log(".env.local already exists; existing configuration was preserved.");
} else {
  fs.writeFileSync(file, [
    "MONGODB_URI=",
    "MONGODB_DB=pearl_dental",
    "NEXTAUTH_URL=http://localhost:3000",
    "NEXTAUTH_SECRET=" + randomBytes(48).toString("hex"),
    "",
  ].join("\n"), { flag: "wx" });
  console.log("Created .env.local with a random authentication secret. Add the Atlas URI before creating your admin account.");
}

