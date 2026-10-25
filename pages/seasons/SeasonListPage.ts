import { expect, type Locator, type Page } from '@playwright/test';

export class SeasonListPage {

  readonly heading: Locator;
  readonly listNavigation: Locator;
  readonly addNavigation: Locator;
  readonly table: Locator;
  readonly noData: Locator;
  readonly numbers: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Seasons'});
    this.listNavigation = page.locator('#seasonListNavigation');
    this.addNavigation = page.locator('#addSeasonNavigation');
    this.table = page.locator('#seasons');
    this.noData = page.locator('#noData');
    this.numbers = page.locator('#seasons tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(showUuid: string): Promise<void> {
    await this.page.goto(`/shows/${showUuid}/seasons`);
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  row(number: number): Locator {
    return this.page.locator('#seasons tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: new RegExp(`^\\s*${number}\\s*$`)})});
  }

  async openDetail(number: number): Promise<void> {
    await this.row(number).first().locator('td[data-nav="name"] a').click();
  }

  async openEpisodes(number: number): Promise<void> {
    await this.row(number).first().locator('td[data-nav="episodes"] a').click();
  }

  async edit(number: number): Promise<void> {
    await this.row(number).first().locator('td[data-nav="edit"] a').click();
  }

  async duplicate(number: number): Promise<void> {
    await this.row(number).first().locator('td[data-nav="duplicate"] a').click();
  }

  async remove(number: number): Promise<void> {
    await this.row(number).first().locator('td[data-nav="remove"] a').click();
  }

  async expectRowCount(number: number, count: number): Promise<void> {
    await expect(this.row(number)).toHaveCount(count);
  }

  async expectPage(info: string): Promise<void> {
    await expect(this.pageInfo).toHaveText(info);
  }

  async expectOpen(showUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/shows/${showUuid}/seasons$`));
    await expect(this.heading).toBeVisible();
  }

}
