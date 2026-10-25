import { expect, type Locator, type Page } from '@playwright/test';

export interface BookItemValues {
  languages?: string[];
  format?: string;
  note?: string;
}

const LANGUAGES = ['CZ', 'EN', 'FR', 'JP', 'SK'];

export class BookItemFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly languages: Locator;
  readonly formats: Locator;
  readonly note: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add book item'});
    this.editHeading = page.getByRole('heading', {name: 'Edit book item'});
    this.languages = page.locator('input[name="languages"]');
    this.formats = page.locator('input[name="format"]');
    this.note = page.locator('#note');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  language(value: string): Locator {
    return this.page.locator(`input[name="languages"][value="${value}"]`);
  }

  format(value: string): Locator {
    return this.page.locator(`input[name="format"][value="${value}"]`);
  }

  async gotoAdd(bookUuid: string): Promise<void> {
    await this.page.goto(`/books/${bookUuid}/items/add`);
  }

  async gotoEdit(bookUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/books/${bookUuid}/items/${uuid}`);
  }

  async fill(values: BookItemValues): Promise<void> {
    for (const language of LANGUAGES) {
      await this.language(language).setChecked((values.languages ?? []).includes(language));
    }
    if (values.format) {
      await this.format(values.format).check();
    }
    await this.note.fill(values.note ?? '');
  }

  async create(values: BookItemValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: BookItemValues): Promise<void> {
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

  async expectAddOpen(bookUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/books/${bookUuid}/items/add$`));
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(bookUuid: string, uuid: string, values: BookItemValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/books/${bookUuid}/items/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    for (const language of LANGUAGES) {
      await expect(this.language(language)).toBeChecked({checked: (values.languages ?? []).includes(language)});
    }
    if (values.format) {
      await expect(this.format(values.format)).toBeChecked();
    }
    await expect(this.note).toHaveValue(values.note ?? '');
  }

}
