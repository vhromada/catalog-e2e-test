import { expect, type Locator, type Page } from '@playwright/test';

export interface SongValues {
  name: string;
  hours?: number | string;
  minutes?: number | string;
  seconds?: number | string;
  note?: string;
}

export class SongFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly name: Locator;
  readonly hours: Locator;
  readonly minutes: Locator;
  readonly seconds: Locator;
  readonly note: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add song'});
    this.editHeading = page.getByRole('heading', {name: 'Edit song'});
    // noinspection DuplicatedCode
    this.name = page.locator('#name');
    this.hours = page.locator('#hours');
    this.minutes = page.locator('#minutes');
    this.seconds = page.locator('#seconds');
    this.note = page.locator('#note');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(musicUuid: string): Promise<void> {
    await this.page.goto(`/music/${musicUuid}/songs/add`);
  }

  async gotoEdit(musicUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/music/${musicUuid}/songs/${uuid}`);
  }

  async fill(values: SongValues): Promise<void> {
    // noinspection DuplicatedCode
    await this.name.fill(values.name);
    await this.hours.fill(String(values.hours ?? 0));
    await this.minutes.fill(String(values.minutes ?? 0));
    await this.seconds.fill(String(values.seconds ?? 0));
    await this.note.fill(values.note ?? '');
  }

  async create(values: SongValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: SongValues): Promise<void> {
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

  async expectAddOpen(musicUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/music/${musicUuid}/songs/add$`));
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(musicUuid: string, uuid: string, values: SongValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/music/${musicUuid}/songs/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.name).toHaveValue(values.name);
    // noinspection DuplicatedCode
    await expect(this.hours).toHaveValue(String(values.hours ?? 0));
    await expect(this.minutes).toHaveValue(String(values.minutes ?? 0));
    await expect(this.seconds).toHaveValue(String(values.seconds ?? 0));
    await expect(this.note).toHaveValue(values.note ?? '');
  }

}
