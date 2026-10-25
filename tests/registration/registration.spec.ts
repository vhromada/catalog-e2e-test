import { accountApi } from '../../api/resources/AccountApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { credentials } from '../../utils/testData';

test.describe('registration (/registration)', () => {

  test('shows empty form', async ({page}) => {
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();

    await expect(registrationPage.heading).toBeVisible();
    await expect(registrationPage.username).toHaveValue('');
    await expect(registrationPage.password).toHaveValue('');
    await expect(registrationPage.copyPassword).toHaveValue('');
    await expect(registrationPage.submitButton).toBeVisible();
    await expect(registrationPage.cancelButton).toBeVisible();
  });

  test('registers a new account and redirects to login', async ({page}) => {
    const creds = credentials();
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.register(creds.username, creds.password);

    await new LoginPage(page).expectOpen();
  });

  test('registered account can log in', async ({page}) => {
    const creds = credentials();
    const registrationPage = new RegistrationPage(page);
    const loginPage = new LoginPage(page);
    await registrationPage.goto();
    await registrationPage.register(creds.username, creds.password);
    await loginPage.expectOpen();
    await loginPage.login(creds.username, creds.password);

    await new CatalogPage(page).expectOpen();
  });

  test('registers an account with the maximum username length', async ({page}) => {
    const creds = credentials();
    creds.username = creds.username.padEnd(200, 'a');
    const registrationPage = new RegistrationPage(page);
    const loginPage = new LoginPage(page);
    await registrationPage.goto();
    await registrationPage.register(creds.username, creds.password);
    await loginPage.expectOpen();
    await loginPage.login(creds.username, creds.password);

    await new CatalogPage(page).expectOpen();
  });

  test('registers an account with the maximum password length', async ({page}) => {
    const creds = credentials({password: 'a'.repeat(200)});
    const registrationPage = new RegistrationPage(page);
    const loginPage = new LoginPage(page);
    await registrationPage.goto();
    await registrationPage.register(creds.username, creds.password);
    await loginPage.expectOpen();
    await loginPage.login(creds.username, creds.password);

    await new CatalogPage(page).expectOpen();
  });

  test('cancel returns to login without registering', async ({page}) => {
    const creds = credentials();
    const registrationPage = new RegistrationPage(page);
    const loginPage = new LoginPage(page);
    await registrationPage.goto();
    await registrationPage.fill(creds.username, creds.password);
    await registrationPage.cancel();

    await loginPage.expectOpen();
    await loginPage.login(creds.username, creds.password);
    await loginPage.expectError('Wrong username or password');
  });

  test('shows error when username already exists', async ({page}) => {
    const creds = credentials();
    await accountApi.registerCredentials(creds);
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.register(creds.username, creds.password);

    await registrationPage.expectError('Username already exists');
    await registrationPage.expectOpen();
  });

  test('shows errors when required fields are empty', async ({page}) => {
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.submit();

    await registrationPage.expectError('Username is required');
    await registrationPage.expectError('Password is required');
    await registrationPage.expectError('Copy of password is required');
    await registrationPage.expectOpen();
  });

  test('shows error when passwords do not match', async ({page}) => {
    const creds = credentials();
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.register(creds.username, creds.password, 'a-different-password');

    await registrationPage.expectError('Passwords must be same');
    await registrationPage.expectOpen();
  });

  test('shows error when username is too long', async ({page}) => {
    const creds = credentials({username: 'a'.repeat(201)});
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.register(creds.username, creds.password);

    await registrationPage.expectError('Maximum length of username is 200');
    await registrationPage.expectOpen();
  });

  test('shows error when password is too long', async ({page}) => {
    const creds = credentials({password: 'a'.repeat(201)});
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.register(creds.username, creds.password);

    await registrationPage.expectError('Maximum length of password is 200');
    await registrationPage.expectOpen();
  });

  test('clears the errors after the fields are corrected', async ({page}) => {
    const creds = credentials();
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.submit();
    await registrationPage.expectError('Username is required');
    await registrationPage.expectError('Password is required');
    await registrationPage.expectError('Copy of password is required');
    await registrationPage.register(creds.username, creds.password);

    await registrationPage.expectNoError('Username is required');
    await registrationPage.expectNoError('Password is required');
    await registrationPage.expectNoError('Copy of password is required');
    await new LoginPage(page).expectOpen();
  });

});
