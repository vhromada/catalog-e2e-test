import { expect, type Locator, type Page } from '@playwright/test';

export interface MovieValues {
  czechName: string;
  originalName: string;
  year: number | string;
  languages: string[];
  subtitles?: string[];
  media: number[];
  csfd?: string;
  imdbCode?: number | string;
  wikiCz?: string;
  wikiEn?: string;
  note?: string;
  genres: string[];
}

const LANGUAGES = ['CZ', 'EN', 'FR', 'JP', 'SK'];
const SUBTITLES = ['CZ', 'EN'];

function split(seconds: number): { hours: number; minutes: number; seconds: number } {
  return {hours: Math.floor(seconds / 3600), minutes: Math.floor(seconds % 3600 / 60), seconds: seconds % 60};
}

export class MovieFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly czechName: Locator;
  readonly originalName: Locator;
  readonly year: Locator;
  readonly languages: Locator;
  readonly subtitles: Locator;
  readonly addMediumButton: Locator;
  readonly csfd: Locator;
  readonly imdbCode: Locator;
  readonly wikiCz: Locator;
  readonly wikiEn: Locator;
  readonly note: Locator;
  readonly genres: Locator;
  readonly picture: Locator;
  readonly choosePictureButton: Locator;
  readonly removePictureButton: Locator;
  readonly pictureModal: Locator;
  readonly pictureModalChooseButton: Locator;
  readonly pictureModalCross: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add movie'});
    this.editHeading = page.getByRole('heading', {name: 'Edit movie'});
    this.czechName = page.locator('#czechName');
    this.originalName = page.locator('#originalName');
    this.year = page.locator('#year');
    this.languages = page.locator('input[name="languages"]');
    this.subtitles = page.locator('input[name="subtitles"]');
    this.addMediumButton = page.locator('#addMedium');
    // noinspection DuplicatedCode
    this.csfd = page.locator('#csfd');
    this.imdbCode = page.locator('#imdbCode');
    this.wikiCz = page.locator('#wikiCz');
    this.wikiEn = page.locator('#wikiEn');
    this.note = page.locator('#note');
    this.genres = page.locator('#genres');
    this.picture = page.locator('form img[alt="Movie"]');
    // noinspection DuplicatedCode
    this.choosePictureButton = page.locator('#choosePicture');
    this.removePictureButton = page.locator('#removePicture');
    this.pictureModal = page.locator('#picturesModal');
    this.pictureModalChooseButton = this.pictureModal.locator('#chooseFocus');
    this.pictureModalCross = this.pictureModal.locator('.btn-close');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  language(value: string): Locator {
    return this.page.locator(`input[name="languages"][value="${value}"]`);
  }

  subtitle(value: string): Locator {
    return this.page.locator(`input[name="subtitles"][value="${value}"]`);
  }

  mediumHours(index: number): Locator {
    return this.page.locator(`#medium${index + 1}Hours`);
  }

  mediumMinutes(index: number): Locator {
    return this.page.locator(`#medium${index + 1}Minutes`);
  }

  mediumSeconds(index: number): Locator {
    return this.page.locator(`#medium${index + 1}Seconds`);
  }

  removeMediumButton(index: number): Locator {
    return this.page.locator(`#removeMedium${index}`);
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/movies/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/movies/${uuid}`);
  }

  async addMedium(): Promise<void> {
    await this.addMediumButton.click();
  }

  async fillMedium(index: number, hours: number | string, minutes: number | string, seconds: number | string): Promise<void> {
    await this.mediumHours(index).fill(String(hours));
    await this.mediumMinutes(index).fill(String(minutes));
    await this.mediumSeconds(index).fill(String(seconds));
  }

  async fill(values: MovieValues): Promise<void> {
    await this.czechName.fill(values.czechName);
    await this.originalName.fill(values.originalName);
    await this.year.fill(String(values.year));
    await expect(this.languages).not.toHaveCount(0);
    for (const language of LANGUAGES) {
      await this.language(language).setChecked(values.languages.includes(language));
    }
    for (const subtitle of SUBTITLES) {
      await this.subtitle(subtitle).setChecked((values.subtitles ?? []).includes(subtitle));
    }
    while (await this.page.locator('[id^="removeMedium"]').count() + 1 < values.media.length) {
      await this.addMedium();
    }
    while (await this.page.locator('[id^="removeMedium"]').count() + 1 > values.media.length) {
      await this.removeMediumButton(await this.page.locator('[id^="removeMedium"]').count()).click();
    }
    for (const [index, length] of values.media.entries()) {
      const time = split(length);
      await this.fillMedium(index, time.hours, time.minutes, time.seconds);
    }
    // noinspection DuplicatedCode
    await this.csfd.fill(values.csfd ?? '');
    await this.imdbCode.fill(String(values.imdbCode ?? ''));
    await this.wikiCz.fill(values.wikiCz ?? '');
    await this.wikiEn.fill(values.wikiEn ?? '');
    await this.note.fill(values.note ?? '');
    await expect(this.genres).toBeVisible();
    await this.genres.selectOption(values.genres);
  }

  async create(values: MovieValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: MovieValues): Promise<void> {
    await this.fill(values);
    await this.updateButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  pictureOption(uuid: string): Locator {
    return this.pictureModal.locator('label.radio', {has: this.page.locator(`img[src$="/${uuid}"]`)}).locator('input');
  }

  async openPictureModal(): Promise<void> {
    await this.choosePictureButton.click();
    await expect(this.pictureModal).toBeVisible();
  }

  async closePictureModalWithCross(): Promise<void> {
    await this.pictureModalCross.click();
    await expect(this.pictureModal).toBeHidden();
  }

  async closePictureModalWithEscape(): Promise<void> {
    await expect(this.pictureModal).toBeFocused();
    await this.page.keyboard.press('Escape');
    await expect(this.pictureModal).toBeHidden();
  }

  // noinspection DuplicatedCode
  async choosePicture(uuid: string): Promise<void> {
    await this.choosePictureButton.click();
    await this.pictureModal.locator('label.radio', {has: this.page.locator(`img[src$="/${uuid}"]`)}).locator('input').check();
    await this.pictureModal.locator('#chooseFocus').click();
    await expect(this.pictureModal).toBeHidden();
  }

  async removePicture(): Promise<void> {
    await this.removePictureButton.click();
  }

  async selectedGenres(): Promise<string[]> {
    return this.genres.evaluate((select: HTMLSelectElement) => Array.from(select.selectedOptions).map((option) => option.value));
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true}).first()).toBeVisible();
  }

  async expectNoError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toHaveCount(0);
  }

  async expectAddOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/movies\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, values: MovieValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/movies/${uuid}$`));
    // noinspection DuplicatedCode
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.czechName).toHaveValue(values.czechName);
    await expect(this.originalName).toHaveValue(values.originalName);
    await expect(this.year).toHaveValue(String(values.year));
    for (const language of LANGUAGES) {
      await expect(this.language(language)).toBeChecked({checked: values.languages.includes(language)});
    }
    for (const subtitle of SUBTITLES) {
      await expect(this.subtitle(subtitle)).toBeChecked({checked: (values.subtitles ?? []).includes(subtitle)});
    }
    for (const [index, length] of values.media.entries()) {
      const time = split(length);
      await expect(this.mediumHours(index)).toHaveValue(String(time.hours));
      await expect(this.mediumMinutes(index)).toHaveValue(String(time.minutes));
      await expect(this.mediumSeconds(index)).toHaveValue(String(time.seconds));
    }
    await expect(this.mediumHours(values.media.length)).toHaveCount(0);
    // noinspection DuplicatedCode
    await expect(this.csfd).toHaveValue(values.csfd ?? '');
    await expect(this.imdbCode).toHaveValue(String(values.imdbCode ?? ''));
    await expect(this.wikiCz).toHaveValue(values.wikiCz ?? '');
    await expect(this.wikiEn).toHaveValue(values.wikiEn ?? '');
    await expect(this.note).toHaveValue(values.note ?? '');
    await expect(this.genres).toBeVisible();
    await expect.poll(async () => (await this.selectedGenres()).sort()).toEqual([...values.genres].sort());
  }

}
