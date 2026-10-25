import { expect, type Locator, type Page } from '@playwright/test';

export interface BookValues {
  czechName: string;
  originalName: string;
  description: string;
  note?: string;
  authors: string[];
}

export class BookFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly czechName: Locator;
  readonly originalName: Locator;
  readonly description: Locator;
  readonly note: Locator;
  readonly authors: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add book'});
    this.editHeading = page.getByRole('heading', {name: 'Edit book'});
    this.czechName = page.locator('#czechName');
    this.originalName = page.locator('#originalName');
    this.description = page.locator('#description');
    this.note = page.locator('#note');
    this.authors = page.locator('#authors');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/books/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/books/${uuid}`);
  }

  async fill(values: BookValues): Promise<void> {
    await this.czechName.fill(values.czechName);
    await this.originalName.fill(values.originalName);
    await this.description.fill(values.description);
    await this.note.fill(values.note ?? '');
    await expect(this.authors).toBeVisible();
    await this.authors.selectOption(values.authors);
  }

  async create(values: BookValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: BookValues): Promise<void> {
    await this.fill(values);
    await this.updateButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async selectedAuthors(): Promise<string[]> {
    return this.authors.evaluate((select: HTMLSelectElement) => Array.from(select.selectedOptions).map((option) => option.value));
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toBeVisible();
  }

  async expectNoError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toHaveCount(0);
  }

  async expectAddOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/books\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, values: BookValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/books/${uuid}$`));
    // noinspection DuplicatedCode
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.czechName).toHaveValue(values.czechName);
    await expect(this.originalName).toHaveValue(values.originalName);
    await expect(this.description).toHaveValue(values.description);
    await expect(this.note).toHaveValue(values.note ?? '');
    await expect(this.authors).toBeVisible();
    await expect.poll(async () => (await this.selectedAuthors()).sort()).toEqual([...values.authors].sort());
  }

}
