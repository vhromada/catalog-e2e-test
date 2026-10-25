import { expect, type Locator, type Page } from '@playwright/test';

export interface MusicValues {
  name: string;
  wikiCz?: string;
  wikiEn?: string;
  mediaCount: number | string;
  note?: string;
}

export class MusicFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly name: Locator;
  readonly wikiCz: Locator;
  readonly wikiEn: Locator;
  readonly mediaCount: Locator;
  readonly note: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add music'});
    this.editHeading = page.getByRole('heading', {name: 'Edit music'});
    this.name = page.locator('#name');
    this.wikiCz = page.locator('#wikiCz');
    this.wikiEn = page.locator('#wikiEn');
    this.mediaCount = page.locator('#mediaCount');
    this.note = page.locator('#note');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/music/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/music/${uuid}`);
  }

  async fill(values: MusicValues): Promise<void> {
    await this.name.fill(values.name);
    await this.wikiCz.fill(values.wikiCz ?? '');
    await this.wikiEn.fill(values.wikiEn ?? '');
    await this.mediaCount.fill(String(values.mediaCount));
    await this.note.fill(values.note ?? '');
  }

  async create(values: MusicValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: MusicValues): Promise<void> {
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
    await expect(this.page).toHaveURL(/\/music\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, values: MusicValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/music/${uuid}$`));
    // noinspection DuplicatedCode
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.name).toHaveValue(values.name);
    await expect(this.wikiCz).toHaveValue(values.wikiCz ?? '');
    await expect(this.wikiEn).toHaveValue(values.wikiEn ?? '');
    await expect(this.mediaCount).toHaveValue(String(values.mediaCount));
    await expect(this.note).toHaveValue(values.note ?? '');
  }

}
