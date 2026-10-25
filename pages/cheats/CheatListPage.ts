import { expect, type Locator, type Page } from '@playwright/test';

export class CheatListPage {

  readonly heading: Locator;
  readonly listNavigation: Locator;
  readonly operations: Locator;
  readonly editLink: Locator;
  readonly removeLink: Locator;
  readonly gameSetting: Locator;
  readonly cheatSetting: Locator;
  readonly actions: Locator;
  readonly descriptions: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Cheats'});
    this.listNavigation = page.locator('#cheatsNavigation');
    this.operations = page.locator('#cheatOperations');
    this.editLink = page.locator('#cheatOperations td[data-nav="edit"] a');
    this.removeLink = page.locator('#cheatOperations td[data-nav="remove"] a');
    this.gameSetting = page.locator('#cheatSettings tr[data-nav="gameSetting"] td[data-nav="data"]');
    this.cheatSetting = page.locator('#cheatSettings tr[data-nav="cheatSetting"] td[data-nav="data"]');
    this.actions = page.locator('#cheats tbody td[data-nav="action"]');
    this.descriptions = page.locator('#cheats tbody td[data-nav="description"]');
  }

  async goto(gameUuid: string): Promise<void> {
    await this.page.goto(`/games/${gameUuid}/cheats`);
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async edit(): Promise<void> {
    await this.editLink.click();
  }

  async remove(): Promise<void> {
    await this.removeLink.click();
  }

  async expectOpen(gameUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/games/${gameUuid}/cheats$`));
    await expect(this.heading).toBeVisible();
  }

}
