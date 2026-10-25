import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({path: ['.env.local', '.env'], quiet: true});

const baseURL = process.env.FE_BASE_URL ?? 'http://localhost:8010';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', {open: 'never'}], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']}
    }
  ]
});
