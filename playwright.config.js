import { defineConfig } from "@playwright/test";

const port = 4173;
const phone = { isMobile: true, hasTouch: true, deviceScaleFactor: 3 };

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}/`,
    locale: "ar-EG",
    // Locally the installed Chrome is used (no browser download); CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
  },
  // Nearly every user is on a phone: iPhone size, small phone, large Android, then desktop.
  projects: [
    { name: "phone", use: { ...phone, viewport: { width: 390, height: 844 } } },
    { name: "small-phone", use: { ...phone, viewport: { width: 320, height: 640 } } },
    { name: "android", use: { ...phone, viewport: { width: 412, height: 915 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: "node tests/serve.js",
    url: `http://127.0.0.1:${port}/`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
});
