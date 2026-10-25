import { expect, type Locator, type Page } from '@playwright/test';

export interface ShowValues {
  czechName: string;
  originalName: string;
  csfd?: string;
  imdbCode?: number | string;
  wikiCz?: string;
  wikiEn?: string;
  note?: string;
  genres: string[];
}

export class ShowFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly czechName: Locator;
  readonly originalName: Locator;
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
    this.addHeading = page.getByRole('heading', {name: 'Add show'});
    this.editHeading = page.getByRole('heading', {name: 'Edit show'});
    this.czechName = page.locator('#czechName');
    this.originalName = page.locator('#originalName');
    // noinspection DuplicatedCode
    this.csfd = page.locator('#csfd');
    this.imdbCode = page.locator('#imdbCode');
    this.wikiCz = page.locator('#wikiCz');
    this.wikiEn = page.locator('#wikiEn');
    this.note = page.locator('#note');
    this.genres = page.locator('#genres');
    this.picture = page.locator('form img[alt="Show"]');
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

  async gotoAdd(): Promise<void> {
    await this.page.goto('/shows/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/shows/${uuid}`);
  }

  async fill(values: ShowValues): Promise<void> {
    await this.czechName.fill(values.czechName);
    await this.originalName.fill(values.originalName);
    // noinspection DuplicatedCode
    await this.csfd.fill(values.csfd ?? '');
    await this.imdbCode.fill(String(values.imdbCode ?? ''));
    await this.wikiCz.fill(values.wikiCz ?? '');
    await this.wikiEn.fill(values.wikiEn ?? '');
    await this.note.fill(values.note ?? '');
    await expect(this.genres).toBeVisible();
    await this.genres.selectOption(values.genres);
  }

  async create(values: ShowValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: ShowValues): Promise<void> {
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
    await expect(this.page.getByText(message, {exact: true})).toBeVisible();
  }

  async expectNoError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toHaveCount(0);
  }

  async expectAddOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/shows\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, values: ShowValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/shows/${uuid}$`));
    // noinspection DuplicatedCode
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.czechName).toHaveValue(values.czechName);
    await expect(this.originalName).toHaveValue(values.originalName);
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
