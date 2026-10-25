import { expect, type Locator, type Page } from '@playwright/test';

export class EpisodeListPage {

  readonly heading: Locator;
  readonly listNavigation: Locator;
  readonly addNavigation: Locator;
  readonly table: Locator;
  readonly noData: Locator;
  readonly names: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Episodes'});
    this.listNavigation = page.locator('#episodeListNavigation');
    this.addNavigation = page.locator('#addEpisodeNavigation');
    this.table = page.locator('#episodes');
    this.noData = page.locator('#noData');
    this.names = page.locator('#episodes tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(showUuid: string, seasonUuid: string): Promise<void> {
    await this.page.goto(`/shows/${showUuid}/seasons/${seasonUuid}/episodes`);
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  row(name: string): Locator {
    return this.page.locator('#episodes tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: name})});
  }

  async openDetail(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="name"] a').click();
  }

  async edit(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="edit"] a').click();
  }

  async duplicate(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="duplicate"] a').click();
  }

  async remove(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="remove"] a').click();
  }

  async expectRowCount(name: string, count: number): Promise<void> {
    await expect(this.row(name)).toHaveCount(count);
  }

  async expectPage(info: string): Promise<void> {
    await expect(this.pageInfo).toHaveText(info);
  }

  async expectOpen(showUuid: string, seasonUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/shows/${showUuid}/seasons/${seasonUuid}/episodes$`));
    await expect(this.heading).toBeVisible();
  }

}
