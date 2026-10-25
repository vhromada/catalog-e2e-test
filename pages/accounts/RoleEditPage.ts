import { expect, type Locator, type Page } from '@playwright/test';

export class RoleEditPage {

  readonly heading: Locator;
  readonly roles: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Edit roles'});
    this.roles = page.locator('input[name="roles"]');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  role(name: string): Locator {
    return this.page.locator(`input[name="roles"][value="${name}"]`);
  }

  async goto(uuid: string): Promise<void> {
    await this.page.goto(`/accounts/${uuid}/roles`);
  }

  async update(roles: string[]): Promise<void> {
    await expect(this.roles).not.toHaveCount(0);
    for (const role of ['ROLE_ADMIN', 'ROLE_USER']) {
      await this.role(role).setChecked(roles.includes(role));
    }
    await this.updateButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toBeVisible();
  }

  async expectOpen(uuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/accounts/${uuid}/roles$`));
    await expect(this.heading).toBeVisible();
  }

}
