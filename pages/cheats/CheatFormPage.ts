import { expect, type Locator, type Page } from '@playwright/test';
import type { CheatData } from '../../api/resources/CheatApi';

export interface CheatValues {
  gameSetting?: string;
  cheatSetting?: string;
  data: CheatData[];
}

export class CheatFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly gameSetting: Locator;
  readonly cheatSetting: Locator;
  readonly addCheatButton: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add cheats'});
    this.editHeading = page.getByRole('heading', {name: 'Edit cheats'});
    this.gameSetting = page.locator('#gameSetting');
    this.cheatSetting = page.locator('#cheatSetting');
    this.addCheatButton = page.locator('#addCheat');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(gameUuid: string): Promise<void> {
    await this.page.goto(`/games/${gameUuid}/cheats/add`);
  }

  async gotoEdit(gameUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/games/${gameUuid}/cheats/${uuid}`);
  }

  action(index: number): Locator {
    return this.page.locator(`#cheat${index}Action`);
  }

  description(index: number): Locator {
    return this.page.locator(`#cheat${index}Description`);
  }

  removeButton(index: number): Locator {
    return this.page.locator(`#removeCheat${index}`);
  }

  async fill(values: CheatValues): Promise<void> {
    await this.gameSetting.fill(values.gameSetting ?? '');
    await this.cheatSetting.fill(values.cheatSetting ?? '');
    for (let i = 0; i < values.data.length; i++) {
      if (i > 0 && await this.action(i).count() === 0) {
        await this.addCheatButton.click();
      }
      await this.action(i).fill(values.data[i].action);
      await this.description(i).fill(values.data[i].description);
    }
  }

  async create(values: CheatValues): Promise<void> {
    await this.fill(values);
    await this.createButton.click();
  }

  async update(values: CheatValues): Promise<void> {
    await this.fill(values);
    await this.updateButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true}).first()).toBeVisible();
  }

  async expectNoError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toHaveCount(0);
  }

  async expectAddOpen(gameUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/games/${gameUuid}/cheats/add$`));
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(gameUuid: string, uuid: string, values: CheatValues): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/games/${gameUuid}/cheats/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.gameSetting).toHaveValue(values.gameSetting ?? '');
    await expect(this.cheatSetting).toHaveValue(values.cheatSetting ?? '');
    for (let i = 0; i < values.data.length; i++) {
      await expect(this.action(i)).toHaveValue(values.data[i].action);
      await expect(this.description(i)).toHaveValue(values.data[i].description);
    }
    await expect(this.action(values.data.length)).toHaveCount(0);
  }

}
