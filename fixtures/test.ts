import { type BrowserContext, type Page, test as base } from '@playwright/test';
import { accountApi, type Credentials, ROLE_ADMIN, ROLE_USER } from '../api/resources/AccountApi';
import { credentials } from '../utils/testData';

interface AuthFixtures {
  authedPage: Page;
  adminPage: Page;
}

interface AuthWorkerFixtures {
  testUser: Credentials;
  adminUser: Credentials;
}

export async function loginAs(context: BrowserContext, creds: Credentials): Promise<Page> {
  const account = await accountApi.checkCredentials(creds);
  await context.addInitScript(([key, value]) => window.sessionStorage.setItem(key, value), ['user', JSON.stringify(account)]);
  const page = await context.newPage();
  await page.goto('/');
  return page;
}

export const test = base.extend<AuthFixtures, AuthWorkerFixtures>({
  // One account per worker, reused across its tests: accounts cannot be deleted through the API.
  testUser: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixture signature requires the destructuring
    async ({}, use) => {
      const creds = credentials();
      await accountApi.registerCredentials(creds);
      await use(creds);
    },
    {scope: 'worker'}
  ],

  // A second account per worker with the admin role (the plain testUser has only the user role).
  adminUser: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixture signature requires the destructuring
    async ({}, use) => {
      const creds = credentials();
      const account = await accountApi.registerCredentials(creds);
      await accountApi.updateRoles(account.uuid, [ROLE_ADMIN, ROLE_USER]);
      await use(creds);
    },
    {scope: 'worker'}
  ],

  authedPage: async ({context, testUser}, use) => {
    const page = await loginAs(context, testUser);
    await use(page);
  },

  adminPage: async ({context, adminUser}, use) => {
    const page = await loginAs(context, adminUser);
    await use(page);
  }
});

export { expect } from '@playwright/test';
