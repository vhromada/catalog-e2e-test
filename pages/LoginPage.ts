import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {

  readonly heading: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;
  readonly registrationLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Login'});
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.submitButton = page.locator('#submit');
    this.registrationLink = page.locator('#registration');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async openRegistration(): Promise<void> {
    await this.registrationLink.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toBeVisible();
  }

  async expectNoError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toHaveCount(0);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login$/);
  }

}
