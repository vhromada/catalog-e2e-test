import { expect, type Locator, type Page } from '@playwright/test';

export class JokeFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly content: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add joke'});
    this.editHeading = page.getByRole('heading', {name: 'Edit joke'});
    this.content = page.locator('#content');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/jokes/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/jokes/${uuid}`);
  }

  async create(content: string): Promise<void> {
    await this.content.fill(content);
    await this.createButton.click();
  }

  async update(content: string): Promise<void> {
    await this.content.fill(content);
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
    await expect(this.page).toHaveURL(/\/jokes\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, content: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/jokes/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.content).toHaveValue(content);
  }

}
