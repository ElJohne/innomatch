import { defineConfig } from "@playwright/test";
import { randomBytes, scryptSync } from "node:crypto";
// These ephemeral credentials exist only in the isolated, visibly synthetic E2E server.
const password =
  process.env.MI_E2E_STAFF_PASSWORD ?? randomBytes(24).toString("hex");
const salt = randomBytes(24).toString("hex");
process.env.MI_E2E_STAFF_PASSWORD = password;
const passwordHash = `scrypt-v1$${salt}$${scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start.mjs",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      DATA_PROVIDER: "fixtures",
      DEMO_DATA_ENABLED: "true",
      AI_PROVIDER: "mock",
      APP_URL: "http://localhost:3000",
      AUTH_SECRET: randomBytes(32).toString("hex"),
      DEMO_STAFF_LOGIN: "coordinator@example.test",
      DEMO_STAFF_PASSWORD_HASH: passwordHash,
      MI_BIND_HOST: "127.0.0.1",
      PORT: "3000",
    },
  },
});
