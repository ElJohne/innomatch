import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start.mjs",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    env: {
      PORT: "3100",
      APP_URL: "http://127.0.0.1:3100",
      DATA_PROVIDER: "fixtures",
      AI_PROVIDER: "mock",
      DEMO_DATA_ENABLED: "true",
    },
    timeout: 60000,
  },
});
