import { expect, type Locator, type Page } from '@playwright/test';

export class GenreFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly name: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add genre'});
    this.editHeading = page.getByRole('heading', {name: 'Edit genre'});
    this.name = page.locator('#name');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/genres/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/genres/${uuid}`);
  }

  async create(name: string): Promise<void> {
    await this.name.fill(name);
    await this.createButton.click();
  }

  async update(name: string): Promise<void> {
    await this.name.fill(name);
    await this.updateButton.click();
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
    await expect(this.page).toHaveURL(/\/genres\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, name: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/genres/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.name).toHaveValue(name);
  }

}
