import { expect, type Locator, type Page } from '@playwright/test';

export interface AuthorValues {
  firstName: string;
  middleName?: string;
  lastName: string;
}

export class AuthorFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly firstName: Locator;
  readonly middleName: Locator;
  readonly lastName: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add author'});
    this.editHeading = page.getByRole('heading', {name: 'Edit author'});
    this.firstName = page.locator('#firstName');
    this.middleName = page.locator('#middleName');
    this.lastName = page.locator('#lastName');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/authors/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/authors/${uuid}`);
  }

  async fill(values: AuthorValues): Promise<void> {
    await this.firstName.fill(values.firstName);
    await this.middleName.fill(values.middleName ?? '');
    await this.lastName.fill(values.lastName);
  }

  async create(values: AuthorValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: AuthorValues): Promise<void> {
    await this.fill(values);
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
    await expect(this.page).toHaveURL(/\/authors\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, values: AuthorValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/authors/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.firstName).toHaveValue(values.firstName);
    await expect(this.middleName).toHaveValue(values.middleName ?? '');
    await expect(this.lastName).toHaveValue(values.lastName);
  }

}
