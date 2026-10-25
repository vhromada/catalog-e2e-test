import { accountApi, ROLE_ADMIN, ROLE_USER } from '../../api/resources/AccountApi';
import { expect, test } from '../../fixtures/test';
import { AccountListPage } from '../../pages/accounts/AccountListPage';
import { RoleEditPage } from '../../pages/accounts/RoleEditPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { credentials, ITEMS_PER_PAGE } from '../../utils/testData';

test.describe('account list (/accounts, admin only)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/accounts');

    await new LoginPage(page).expectOpen();
  });

  test('redirects user without admin role to the catalog', async ({authedPage}) => {
    await new AccountListPage(authedPage).goto();

    await new CatalogPage(authedPage).expectOpen();
    await expect(authedPage).not.toHaveURL(/\/accounts/);
  });

  test('shows heading, search form and statistics', async ({adminPage}) => {
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();

    await accountListPage.expectOpen();
    await expect(accountListPage.searchUsername).toBeVisible();
    await expect(accountListPage.searchButton).toBeVisible();
    await expect(accountListPage.count).toHaveText(/\d+/);
  });

  // The DB is shared with tests running in parallel, so the BE data is compared only when it did not change while the FE was loading.
  test('shows statistics from BE', async ({adminPage}) => {
    const accountListPage = new AccountListPage(adminPage);

    await expect(async () => {
      const before = await accountApi.statistics();
      await accountListPage.goto();
      await expect(accountListPage.count).toHaveText(/\d+/);
      const shown = await accountListPage.count.innerText();
      const after = await accountApi.statistics();

      expect(after).toEqual(before);
      expect(shown).toBe(String(before.count));
    }).toPass();
  });

  test('shows main menu with the accounts link', async ({adminPage}) => {
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();

    await new CatalogPage(adminPage).expectAdminMenu();
  });

  test('opens the accounts from the main menu', async ({adminPage}) => {
    const catalogPage = new CatalogPage(adminPage);
    await catalogPage.goto();
    await catalogPage.openAccounts();

    await new AccountListPage(adminPage).expectOpen();
  });

  test('shows an account with its roles', async ({adminPage}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();
    await accountListPage.search(creds.username);

    await accountListPage.expectRowCount(creds.username, 1);
    await expect(accountListPage.roles(creds.username)).toHaveText('User');
  });

  test('shows all roles of an account', async ({adminPage}) => {
    const creds = credentials();
    const account = await accountApi.registerCredentials(creds);
    await accountApi.updateRoles(account.uuid, [ROLE_ADMIN, ROLE_USER]);
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();
    await accountListPage.search(creds.username);

    await expect(accountListPage.roles(creds.username)).toContainText('Admin');
    await expect(accountListPage.roles(creds.username)).toContainText('User');
  });

  test('searches accounts by username', async ({adminPage}) => {
    const creds = credentials();
    const other = credentials();
    await accountApi.registerCredentials(creds);
    await accountApi.registerCredentials(other);
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();
    await accountListPage.search(creds.username);

    await accountListPage.expectRowCount(creds.username, 1);
    await accountListPage.expectRowCount(other.username, 0);
  });

  test('shows no table when search finds nothing', async ({adminPage}) => {
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();
    await accountListPage.search(credentials().username);

    await expect(accountListPage.table).toHaveCount(0);
  });

  test('does not show paging for a single page of results', async ({adminPage}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();
    await accountListPage.search(creds.username);

    await accountListPage.expectRowCount(creds.username, 1);
    await expect(accountListPage.pageInfo).toHaveCount(0);
  });

  test('opens roles of the account', async ({adminPage}) => {
    const creds = credentials();
    const account = await accountApi.registerCredentials(creds);
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();
    await accountListPage.search(creds.username);
    await accountListPage.editRoles(creds.username);

    await new RoleEditPage(adminPage).expectOpen(account.uuid);
  });

  // Accounts cannot be deleted through the API, so this test leaves ITEMS_PER_PAGE + 1 accounts in the DB.
  test('pages through search results', async ({adminPage}) => {
    const prefix = credentials().username;
    await Promise.all(Array.from({length: ITEMS_PER_PAGE + 1}, (_, i) => accountApi.registerCredentials({username: `${prefix}-${i}`, password: 'Passw0rd!'})));
    const accountListPage = new AccountListPage(adminPage);
    await accountListPage.goto();
    await accountListPage.search(prefix);

    await expect(accountListPage.usernames).toHaveCount(ITEMS_PER_PAGE);
    await accountListPage.expectPage('1 / 2');
    await expect(accountListPage.first).toHaveCount(0);
    await expect(accountListPage.previous).toHaveCount(0);

    await accountListPage.next.click();
    await expect(accountListPage.usernames).toHaveCount(1);
    await accountListPage.expectPage('2 / 2');
    await expect(accountListPage.next).toHaveCount(0);
    await expect(accountListPage.last).toHaveCount(0);

    await accountListPage.previous.click();
    await expect(accountListPage.usernames).toHaveCount(ITEMS_PER_PAGE);
    await accountListPage.expectPage('1 / 2');

    await accountListPage.last.click();
    await expect(accountListPage.usernames).toHaveCount(1);
    await accountListPage.expectPage('2 / 2');

    await accountListPage.first.click();
    await expect(accountListPage.usernames).toHaveCount(ITEMS_PER_PAGE);
    await accountListPage.expectPage('1 / 2');
  });

});
