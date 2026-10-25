import { expect, type Locator, type Page } from '@playwright/test';

export interface SeasonValues {
  number: number | string;
  startYear: number | string;
  endYear: number | string;
  language?: string;
  subtitles?: string[];
  note?: string;
}

const SUBTITLES = ['CZ', 'EN'];

export class SeasonFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly number: Locator;
  readonly startYear: Locator;
  readonly endYear: Locator;
  readonly languages: Locator;
  readonly subtitles: Locator;
  readonly note: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add season'});
    this.editHeading = page.getByRole('heading', {name: 'Edit season'});
    this.number = page.locator('#number');
    this.startYear = page.locator('#startYear');
    this.endYear = page.locator('#endYear');
    this.languages = page.locator('input[name="language"]');
    this.subtitles = page.locator('input[name="subtitles"]');
    this.note = page.locator('#note');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  language(value: string): Locator {
    return this.page.locator(`input[name="language"][value="${value}"]`);
  }

  subtitle(value: string): Locator {
    return this.page.locator(`input[name="subtitles"][value="${value}"]`);
  }

  async gotoAdd(showUuid: string): Promise<void> {
    await this.page.goto(`/shows/${showUuid}/seasons/add`);
  }

  async gotoEdit(showUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/shows/${showUuid}/seasons/${uuid}`);
  }

  async fill(values: SeasonValues): Promise<void> {
    await this.number.fill(String(values.number));
    await this.startYear.fill(String(values.startYear));
    await this.endYear.fill(String(values.endYear));
    if (values.language) {
      await this.language(values.language).check();
    }
    for (const subtitle of SUBTITLES) {
      await this.subtitle(subtitle).setChecked((values.subtitles ?? []).includes(subtitle));
    }
    await this.note.fill(values.note ?? '');
  }

  async create(values: SeasonValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: SeasonValues): Promise<void> {
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

  async expectAddOpen(showUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/shows/${showUuid}/seasons/add$`));
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(showUuid: string, uuid: string, values: SeasonValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/shows/${showUuid}/seasons/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.number).toHaveValue(String(values.number));
    await expect(this.startYear).toHaveValue(String(values.startYear));
    await expect(this.endYear).toHaveValue(String(values.endYear));
    if (values.language) {
      await expect(this.language(values.language)).toBeChecked();
    }
    for (const subtitle of SUBTITLES) {
      await expect(this.subtitle(subtitle)).toBeChecked({checked: (values.subtitles ?? []).includes(subtitle)});
    }
    await expect(this.note).toHaveValue(values.note ?? '');
  }

}
