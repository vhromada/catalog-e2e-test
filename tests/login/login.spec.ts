import { accountApi } from '../../api/resources/AccountApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { credentials } from '../../utils/testData';

test.describe('login (/login)', () => {

  test('shows empty form', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.username).toHaveValue('');
    await expect(loginPage.password).toHaveValue('');
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.registrationLink).toBeVisible();
  });

  test('logs in with valid credentials', async ({page}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(creds.username, creds.password);

    await new CatalogPage(page).expectOpen();
  });

  test('keeps the user logged in after reload', async ({page}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const loginPage = new LoginPage(page);
    const catalogPage = new CatalogPage(page);
    await loginPage.goto();
    await loginPage.login(creds.username, creds.password);
    await catalogPage.expectOpen();
    await page.reload();

    await catalogPage.expectOpen();
  });

  test('logs out', async ({page}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const loginPage = new LoginPage(page);
    const catalogPage = new CatalogPage(page);
    await loginPage.goto();
    await loginPage.login(creds.username, creds.password);
    await catalogPage.expectOpen();
    await catalogPage.logout();

    await loginPage.expectOpen();
  });

  test('links to registration', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.openRegistration();

    const registrationPage = new RegistrationPage(page);
    await registrationPage.expectOpen();
    await expect(registrationPage.heading).toBeVisible();
  });

  test('shows error for wrong password', async ({page}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(creds.username, 'wrong-password');

    await loginPage.expectError('Wrong username or password');
    await loginPage.expectOpen();
  });

  test('shows error for unknown user', async ({page}) => {
    const creds = credentials();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(creds.username, creds.password);

    await loginPage.expectError('Wrong username or password');
    await loginPage.expectOpen();
  });

  test('shows errors when required fields are empty', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();

    await loginPage.expectError('Username is required');
    await loginPage.expectError('Password is required');
    await loginPage.expectOpen();
  });

  test('clears the errors after the fields are corrected', async ({page}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();
    await loginPage.expectError('Username is required');
    await loginPage.expectError('Password is required');
    await loginPage.login(creds.username, creds.password);

    await loginPage.expectNoError('Username is required');
    await loginPage.expectNoError('Password is required');
    await new CatalogPage(page).expectOpen();
  });

});
