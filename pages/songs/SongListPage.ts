import { expect, type Locator, type Page } from '@playwright/test';

export class SongListPage {

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
    this.heading = page.getByRole('heading', {name: 'Songs'});
    this.listNavigation = page.locator('#songListNavigation');
    this.addNavigation = page.locator('#addSongNavigation');
    this.table = page.locator('#songs');
    this.noData = page.locator('#noData');
    this.names = page.locator('#songs tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(musicUuid: string): Promise<void> {
    await this.page.goto(`/music/${musicUuid}/songs`);
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  row(name: string): Locator {
    return this.page.locator('#songs tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: name})});
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

  async expectOpen(musicUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/music/${musicUuid}/songs$`));
    await expect(this.heading).toBeVisible();
  }

}
