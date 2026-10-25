import { accountApi, ROLE_ADMIN, ROLE_USER } from '../../api/resources/AccountApi';
import { expect, loginAs, test } from '../../fixtures/test';
import { AccountListPage } from '../../pages/accounts/AccountListPage';
import { RoleEditPage } from '../../pages/accounts/RoleEditPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { credentials, INVALID_UUID } from '../../utils/testData';

test.describe('edit roles (/accounts/:uuid/roles, admin only)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/accounts/${INVALID_UUID}/roles`);

    await new LoginPage(page).expectOpen();
  });

  test('redirects user without admin role to the catalog', async ({authedPage}) => {
    const account = await accountApi.registerCredentials(credentials());
    await new RoleEditPage(authedPage).goto(account.uuid);

    await new CatalogPage(authedPage).expectOpen();
    await expect(authedPage).not.toHaveURL(/\/roles/);
  });

  test('shows the roles of the account from BE', async ({adminPage}) => {
    const account = await accountApi.registerCredentials(credentials());
    const roleEditPage = new RoleEditPage(adminPage);
    await roleEditPage.goto(account.uuid);

    await roleEditPage.expectOpen(account.uuid);
    await expect(roleEditPage.role(ROLE_USER)).toBeChecked();
    await expect(roleEditPage.role(ROLE_ADMIN)).not.toBeChecked();
    await expect(roleEditPage.updateButton).toBeVisible();
    await expect(roleEditPage.cancelButton).toBeVisible();
  });

  test('shows all roles of the account from BE', async ({adminPage}) => {
    const account = await accountApi.registerCredentials(credentials());
    await accountApi.updateRoles(account.uuid, [ROLE_ADMIN, ROLE_USER]);
    const roleEditPage = new RoleEditPage(adminPage);
    await roleEditPage.goto(account.uuid);

    await expect(roleEditPage.role(ROLE_USER)).toBeChecked();
    await expect(roleEditPage.role(ROLE_ADMIN)).toBeChecked();
  });

  test('shows main menu with the accounts link', async ({adminPage}) => {
    const account = await accountApi.registerCredentials(credentials());
    await new RoleEditPage(adminPage).goto(account.uuid);

    await new CatalogPage(adminPage).expectAdminMenu();
  });

  test('updates the roles and stores them in BE', async ({adminPage}) => {
    const creds = credentials();
    const account = await accountApi.registerCredentials(creds);
    const accountListPage = new AccountListPage(adminPage);
    const roleEditPage = new RoleEditPage(adminPage);
    await accountListPage.goto();
    await accountListPage.search(creds.username);
    await accountListPage.editRoles(creds.username);
    await roleEditPage.expectOpen(account.uuid);
    await roleEditPage.update([ROLE_ADMIN, ROLE_USER]);

    await accountListPage.expectOpen();
    expect((await accountApi.get(account.uuid)).roles.sort()).toEqual([ROLE_ADMIN, ROLE_USER]);
    await accountListPage.search(creds.username);
    await expect(accountListPage.roles(creds.username)).toContainText('Admin');
  });

  test('replaces a role', async ({adminPage}) => {
    const account = await accountApi.registerCredentials(credentials());
    const roleEditPage = new RoleEditPage(adminPage);
    await roleEditPage.goto(account.uuid);
    await roleEditPage.update([ROLE_ADMIN]);

    await new AccountListPage(adminPage).expectOpen();
    expect((await accountApi.get(account.uuid)).roles).toEqual([ROLE_ADMIN]);
  });

  test('shows error when no role is selected', async ({adminPage}) => {
    const account = await accountApi.registerCredentials(credentials());
    const roleEditPage = new RoleEditPage(adminPage);
    await roleEditPage.goto(account.uuid);
    await roleEditPage.update([]);

    await roleEditPage.expectError('At least 1 role is required');
    await roleEditPage.expectOpen(account.uuid);
    expect((await accountApi.get(account.uuid)).roles).toEqual([ROLE_USER]);
  });

  test('cancel returns to the account list without saving', async ({adminPage}) => {
    const account = await accountApi.registerCredentials(credentials());
    const roleEditPage = new RoleEditPage(adminPage);
    await roleEditPage.goto(account.uuid);
    await expect(roleEditPage.role(ROLE_USER)).toBeChecked();
    await roleEditPage.role(ROLE_ADMIN).check();
    await roleEditPage.cancel();

    await new AccountListPage(adminPage).expectOpen();
    expect((await accountApi.get(account.uuid)).roles).toEqual([ROLE_USER]);
  });

  test('admin who removes own admin role is redirected to the catalog', async ({context}) => {
    const creds = credentials();
    const account = await accountApi.registerCredentials(creds);
    await accountApi.updateRoles(account.uuid, [ROLE_ADMIN, ROLE_USER]);
    const page = await loginAs(context, creds);
    const roleEditPage = new RoleEditPage(page);
    await roleEditPage.goto(account.uuid);
    await roleEditPage.update([ROLE_USER]);

    const catalogPage = new CatalogPage(page);
    await catalogPage.expectOpen();
    await catalogPage.expectMainMenu();
    expect((await accountApi.get(account.uuid)).roles).toEqual([ROLE_USER]);
  });

});
