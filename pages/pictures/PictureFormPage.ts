import { expect, type Locator, type Page } from '@playwright/test';

export class PictureFormPage {

  readonly addHeading: Locator;
  readonly file: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add picture'});
    this.file = page.locator('#file');
    this.createButton = page.locator('#create');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/pictures/add');
  }

  async choose(content: Buffer, name = 'picture.png'): Promise<void> {
    await this.file.setInputFiles({name, mimeType: 'image/png', buffer: content});
  }

  async create(content: Buffer): Promise<void> {
    await this.choose(content);
    await this.createButton.click();
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

  async expectAddOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pictures\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
  }

}
