import { accountApi, ROLE_ADMIN, ROLE_USER } from '../../api/resources/AccountApi';
import { expect, loginAs, test } from '../../fixtures/test';
import { AccountEditPage } from '../../pages/accounts/AccountEditPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { credentials } from '../../utils/testData';

// The page is available to every logged in user, the tests use a fresh account because the update changes the credentials.
test.describe('edit account (/accounts/edit)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/accounts/edit');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const accountEditPage = new AccountEditPage(authedPage);
    await accountEditPage.goto();

    await accountEditPage.expectOpen();
    await expect(accountEditPage.username).toHaveValue('');
    await expect(accountEditPage.password).toHaveValue('');
    await expect(accountEditPage.copyPassword).toHaveValue('');
    await expect(accountEditPage.submitButton).toHaveText('Update');
    await expect(accountEditPage.cancelButton).toBeVisible();
  });

  test('shows main menu for a user without admin role', async ({authedPage}) => {
    await new AccountEditPage(authedPage).goto();

    await new CatalogPage(authedPage).expectMainMenu();
  });

  test('shows main menu with the accounts link for an admin', async ({adminPage}) => {
    await new AccountEditPage(adminPage).goto();

    await new CatalogPage(adminPage).expectAdminMenu();
  });

  test('opens the form from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openEditAccount();

    await new AccountEditPage(authedPage).expectOpen();
  });

  test('updates the credentials of a user and stores them in BE', async ({context}) => {
    const creds = credentials();
    const account = await accountApi.registerCredentials(creds);
    const newCreds = credentials({password: 'N3wPassw0rd!'});
    const page = await loginAs(context, creds);
    const accountEditPage = new AccountEditPage(page);
    await accountEditPage.goto();
    await accountEditPage.update(newCreds.username, newCreds.password);

    await new CatalogPage(page).expectOpen();
    expect(await accountApi.checkCredentials(newCreds)).toMatchObject({uuid: account.uuid, username: newCreds.username});
    await expect(accountApi.checkCredentials(creds)).rejects.toThrow();
  });

  test('keeps the user logged in and with the roles after the update', async ({context}) => {
    const creds = credentials();
    const account = await accountApi.registerCredentials(creds);
    await accountApi.updateRoles(account.uuid, [ROLE_ADMIN, ROLE_USER]);
    const newCreds = credentials({password: 'N3wPassw0rd!'});
    const page = await loginAs(context, creds);
    const accountEditPage = new AccountEditPage(page);
    await accountEditPage.goto();
    await accountEditPage.update(newCreds.username, newCreds.password);

    const catalogPage = new CatalogPage(page);
    await catalogPage.expectOpen();
    await page.reload();
    await catalogPage.expectOpen();
    await catalogPage.expectAdminMenu();
    expect((await accountApi.get(account.uuid)).roles.sort()).toEqual([ROLE_ADMIN, ROLE_USER]);
  });

  test('updated credentials can be used to log in', async ({context, page}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const newCreds = credentials({password: 'N3wPassw0rd!'});
    const editPage = await loginAs(context, creds);
    const accountEditPage = new AccountEditPage(editPage);
    await accountEditPage.goto();
    await accountEditPage.update(newCreds.username, newCreds.password);
    await new CatalogPage(editPage).expectOpen();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(newCreds.username, newCreds.password);

    await new CatalogPage(page).expectOpen();
  });

  test('shows error when username already exists', async ({context}) => {
    const creds = credentials();
    const other = credentials();
    const account = await accountApi.registerCredentials(creds);
    await accountApi.registerCredentials(other);
    const page = await loginAs(context, creds);
    const accountEditPage = new AccountEditPage(page);
    await accountEditPage.goto();
    await accountEditPage.update(other.username, 'N3wPassw0rd!');

    await accountEditPage.expectError('Username already exists');
    await accountEditPage.expectOpen();
    expect((await accountApi.get(account.uuid)).username).toBe(creds.username);
  });

  test('cancel returns to the catalog without saving', async ({context}) => {
    const creds = credentials();
    const account = await accountApi.registerCredentials(creds);
    const page = await loginAs(context, creds);
    const accountEditPage = new AccountEditPage(page);
    await accountEditPage.goto();
    await accountEditPage.fill(credentials().username, 'N3wPassw0rd!');
    await accountEditPage.cancel();

    await new CatalogPage(page).expectOpen();
    expect((await accountApi.get(account.uuid)).username).toBe(creds.username);
  });

  test('shows errors when fields are empty', async ({authedPage}) => {
    const accountEditPage = new AccountEditPage(authedPage);
    await accountEditPage.goto();
    await accountEditPage.submit();

    await accountEditPage.expectError('Username is required');
    await accountEditPage.expectError('Password is required');
    await accountEditPage.expectError('Copy of password is required');
    await accountEditPage.expectOpen();
  });

  test('shows error when passwords are different', async ({authedPage}) => {
    const accountEditPage = new AccountEditPage(authedPage);
    await accountEditPage.goto();
    await accountEditPage.update(credentials().username, 'Passw0rd!', 'Different!');

    await accountEditPage.expectError('Passwords must be same');
    await accountEditPage.expectOpen();
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const accountEditPage = new AccountEditPage(authedPage);
    await accountEditPage.goto();
    await accountEditPage.update('a'.repeat(201), 'b'.repeat(201), 'c'.repeat(201));

    await accountEditPage.expectError('Maximum length of username is 200');
    await accountEditPage.expectError('Maximum length of password is 200');
    await accountEditPage.expectError('Maximum length of copy of password is 200');
    await accountEditPage.expectOpen();
  });

  test('clears the errors after the fields are corrected', async ({context}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const newCreds = credentials({password: 'N3wPassw0rd!'});
    const page = await loginAs(context, creds);
    const accountEditPage = new AccountEditPage(page);
    await accountEditPage.goto();
    await accountEditPage.update(newCreds.username, newCreds.password, 'Different!');
    await accountEditPage.expectError('Passwords must be same');
    await accountEditPage.update(newCreds.username, newCreds.password);

    await accountEditPage.expectNoError('Passwords must be same');
    await new CatalogPage(page).expectOpen();
    expect(await accountApi.checkCredentials(newCreds)).toMatchObject({username: newCreds.username});
  });

});
