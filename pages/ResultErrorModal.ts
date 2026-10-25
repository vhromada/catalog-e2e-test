import { expect, type Locator, type Page } from '@playwright/test';

export class ResultErrorModal {

  readonly modal: Locator;
  readonly title: Locator;
  readonly code: Locator;
  readonly message: Locator;
  readonly closeButton: Locator;
  readonly crossButton: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.locator('#resultError');
    this.title = this.modal.locator('.modal-title');
    this.code = this.modal.locator('tbody tr').nth(0).locator('code');
    this.message = this.modal.locator('tbody tr').nth(1).locator('code');
    this.closeButton = page.locator('#resultErrorFocus');
    this.crossButton = this.modal.locator('.btn-close');
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async closeWithCross(): Promise<void> {
    await this.crossButton.click();
  }

  async closeWithEscape(): Promise<void> {
    await expect(this.modal).toBeFocused();
    await this.page.keyboard.press('Escape');
  }

  async expectOpen(code?: string): Promise<void> {
    await expect(this.modal).toBeVisible();
    await expect(this.title).toHaveText('Error');
    await expect(this.closeButton).toBeVisible();
    if (code) {
      await expect(this.code).toHaveText(code);
    }
  }

  async expectClosed(): Promise<void> {
    await expect(this.modal).toBeHidden();
  }

}
