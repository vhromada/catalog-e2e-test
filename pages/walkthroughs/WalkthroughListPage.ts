import { expect, type Locator, type Page } from '@playwright/test';

export class WalkthroughListPage {

  readonly heading: Locator;
  readonly listNavigation: Locator;
  readonly operations: Locator;
  readonly editLink: Locator;
  readonly removeLink: Locator;
  readonly content: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Walkthroughs'});
    this.listNavigation = page.locator('#walkthroughsNavigation');
    this.operations = page.locator('#walkthroughOperations');
    this.editLink = page.locator('#walkthroughOperations td[data-nav="edit"] a');
    this.removeLink = page.locator('#walkthroughOperations td[data-nav="remove"] a');
    this.content = page.locator('.rich-content');
  }

  async goto(gameUuid: string): Promise<void> {
    await this.page.goto(`/games/${gameUuid}/walkthroughs`);
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
    await expect(this.page).toHaveURL(new RegExp(`/games/${gameUuid}/walkthroughs$`));
    await expect(this.heading).toBeVisible();
  }

}
