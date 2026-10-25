import { expect, type Locator, type Page } from '@playwright/test';

export interface GameValues {
  name: string;
  wikiCz?: string;
  wikiEn?: string;
  mediaCount: number | string;
  format?: string;
  crack?: boolean;
  serialKey?: boolean;
  patch?: boolean;
  trainer?: boolean;
  trainerData?: boolean;
  editor?: boolean;
  saves?: boolean;
  otherData?: string;
  note?: string;
}

export class GameFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly name: Locator;
  readonly wikiCz: Locator;
  readonly wikiEn: Locator;
  readonly mediaCount: Locator;
  readonly formats: Locator;
  readonly crack: Locator;
  readonly serialKey: Locator;
  readonly patch: Locator;
  readonly trainer: Locator;
  readonly trainerData: Locator;
  readonly editor: Locator;
  readonly saves: Locator;
  readonly otherData: Locator;
  readonly note: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add game'});
    this.editHeading = page.getByRole('heading', {name: 'Edit game'});
    // noinspection DuplicatedCode
    this.name = page.locator('#name');
    this.wikiCz = page.locator('#wikiCz');
    this.wikiEn = page.locator('#wikiEn');
    this.mediaCount = page.locator('#mediaCount');
    this.formats = page.locator('input[name="format"]');
    this.crack = page.locator('#crack');
    this.serialKey = page.locator('#serialKey');
    this.patch = page.locator('#patch');
    this.trainer = page.locator('#trainer');
    this.trainerData = page.locator('#trainerData');
    this.editor = page.locator('#editor');
    this.saves = page.locator('#saves');
    // noinspection DuplicatedCode
    this.otherData = page.locator('#otherData');
    this.note = page.locator('#note');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/games/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/games/${uuid}`);
  }

  format(code: string): Locator {
    return this.page.locator(`input[name="format"][value="${code}"]`);
  }

  async fill(values: GameValues): Promise<void> {
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
    await this.patch.setChecked(values.patch ?? false);
    await this.trainer.setChecked(values.trainer ?? false);
    await this.trainerData.setChecked(values.trainerData ?? false);
    await this.editor.setChecked(values.editor ?? false);
    await this.saves.setChecked(values.saves ?? false);
    await this.otherData.fill(values.otherData ?? '');
    await this.note.fill(values.note ?? '');
  }

  async create(values: GameValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: GameValues): Promise<void> {
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
    await expect(this.page).toHaveURL(/\/games\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, values: GameValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/games/${uuid}$`));
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
    await expect(this.patch).toBeChecked({checked: values.patch ?? false});
    await expect(this.trainer).toBeChecked({checked: values.trainer ?? false});
    await expect(this.trainerData).toBeChecked({checked: values.trainerData ?? false});
    await expect(this.editor).toBeChecked({checked: values.editor ?? false});
    await expect(this.saves).toBeChecked({checked: values.saves ?? false});
    await expect(this.otherData).toHaveValue(values.otherData ?? '');
    await expect(this.note).toHaveValue(values.note ?? '');
  }

}
