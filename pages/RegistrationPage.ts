import { expect, type Locator, type Page } from '@playwright/test';

export class RegistrationPage {

  readonly heading: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly copyPassword: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Registration'});
    // noinspection DuplicatedCode
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.copyPassword = page.locator('#copyPassword');
    this.submitButton = page.locator('#submit');
    this.cancelButton = page.locator('#cancel');
  }

  async goto(): Promise<void> {
    await this.page.goto('/registration');
  }

  async fill(username: string, password: string, copyPassword: string = password): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.copyPassword.fill(copyPassword);
  }

  async register(username: string, password: string, copyPassword: string = password): Promise<void> {
    await this.fill(username, password, copyPassword);
    await this.submit();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toBeVisible();
  }

  async expectNoError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toHaveCount(0);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/registration$/);
  }

}
