import { expect, type Locator, type Page } from '@playwright/test';

export interface EpisodeValues {
  number?: number | string;
  name: string;
  hours?: number | string;
  minutes?: number | string;
  seconds?: number | string;
  note?: string;
}

export class EpisodeFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly number: Locator;
  readonly name: Locator;
  readonly hours: Locator;
  readonly minutes: Locator;
  readonly seconds: Locator;
  readonly note: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add episode'});
    this.editHeading = page.getByRole('heading', {name: 'Edit episode'});
    this.number = page.locator('#number');
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

  async gotoAdd(showUuid: string, seasonUuid: string): Promise<void> {
    await this.page.goto(`/shows/${showUuid}/seasons/${seasonUuid}/episodes/add`);
  }

  async gotoEdit(showUuid: string, seasonUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/shows/${showUuid}/seasons/${seasonUuid}/episodes/${uuid}`);
  }

  async fill(values: EpisodeValues): Promise<void> {
    await this.number.fill(String(values.number ?? 1));
    // noinspection DuplicatedCode
    await this.name.fill(values.name);
    await this.hours.fill(String(values.hours ?? 0));
    await this.minutes.fill(String(values.minutes ?? 0));
    await this.seconds.fill(String(values.seconds ?? 0));
    await this.note.fill(values.note ?? '');
  }

  async create(values: EpisodeValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: EpisodeValues): Promise<void> {
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

  async expectAddOpen(showUuid: string, seasonUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/shows/${showUuid}/seasons/${seasonUuid}/episodes/add$`));
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(showUuid: string, seasonUuid: string, uuid: string, values: EpisodeValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/shows/${showUuid}/seasons/${seasonUuid}/episodes/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.number).toHaveValue(String(values.number ?? 1));
    // noinspection DuplicatedCode
    await expect(this.name).toHaveValue(values.name);
    await expect(this.hours).toHaveValue(String(values.hours ?? 0));
    await expect(this.minutes).toHaveValue(String(values.minutes ?? 0));
    await expect(this.seconds).toHaveValue(String(values.seconds ?? 0));
    await expect(this.note).toHaveValue(values.note ?? '');
  }

}
