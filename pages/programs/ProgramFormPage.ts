import { expect, type Locator, type Page } from '@playwright/test';

export interface ProgramValues {
  name: string;
  wikiCz?: string;
  wikiEn?: string;
  mediaCount: number | string;
  format?: string;
  crack?: boolean;
  serialKey?: boolean;
  otherData?: string;
  note?: string;
}

export class ProgramFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly name: Locator;
  readonly wikiCz: Locator;
  readonly wikiEn: Locator;
  readonly mediaCount: Locator;
  readonly formats: Locator;
  readonly crack: Locator;
  readonly serialKey: Locator;
  readonly otherData: Locator;
  readonly note: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add program'});
    this.editHeading = page.getByRole('heading', {name: 'Edit program'});
    // noinspection DuplicatedCode
    this.name = page.locator('#name');
    this.wikiCz = page.locator('#wikiCz');
    this.wikiEn = page.locator('#wikiEn');
    this.mediaCount = page.locator('#mediaCount');
    this.formats = page.locator('input[name="format"]');
    this.crack = page.locator('#crack');
    this.serialKey = page.locator('#serialKey');
    // noinspection DuplicatedCode
    this.otherData = page.locator('#otherData');
    this.note = page.locator('#note');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/programs/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/programs/${uuid}`);
  }

  format(code: string): Locator {
    return this.page.locator(`input[name="format"][value="${code}"]`);
  }

  async fill(values: ProgramValues): Promise<void> {
    // noinspection DuplicatedCode
    await this.name.fill(values.name);
    await this.wikiCz.fill(values.wikiCz ?? '');
    await this.wikiEn.fill(values.wikiEn ?? '');
    await this.mediaCount.fill(String(values.mediaCount));
    await expect(this.formats.first()).toBeVisible();
    if (values.format) {
      await this.format(values.format).check();
    }
    await this.crack.setChecked(values.crack ?? false);
    await this.serialKey.setChecked(values.serialKey ?? false);
    await this.otherData.fill(values.otherData ?? '');
    await this.note.fill(values.note ?? '');
  }

  async create(values: ProgramValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: ProgramValues): Promise<void> {
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
    await expect(this.page).toHaveURL(/\/programs\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, values: ProgramValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/programs/${uuid}$`));
    // noinspection DuplicatedCode
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.name).toHaveValue(values.name);
    await expect(this.wikiCz).toHaveValue(values.wikiCz ?? '');
    await expect(this.wikiEn).toHaveValue(values.wikiEn ?? '');
    await expect(this.mediaCount).toHaveValue(String(values.mediaCount));
    await expect(this.formats.first()).toBeVisible();
    if (values.format) {
      await expect(this.format(values.format)).toBeChecked();
    }
    await expect(this.crack).toBeChecked({checked: values.crack ?? false});
    await expect(this.serialKey).toBeChecked({checked: values.serialKey ?? false});
    await expect(this.otherData).toHaveValue(values.otherData ?? '');
    await expect(this.note).toHaveValue(values.note ?? '');
  }

}
