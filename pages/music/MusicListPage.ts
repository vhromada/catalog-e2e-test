import { expect, type Locator, type Page } from '@playwright/test';

export class MusicListPage {

  readonly heading: Locator;
  readonly searchName: Locator;
  readonly searchButton: Locator;
  readonly listNavigation: Locator;
  readonly addNavigation: Locator;
  readonly table: Locator;
  readonly names: Locator;
  readonly count: Locator;
  readonly mediaCount: Locator;
  readonly songsCount: Locator;
  readonly totalLength: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Music', exact: true});
    this.searchName = page.locator('form #name');
    this.searchButton = page.locator('#search');
    this.listNavigation = page.locator('#musicListNavigation');
    this.addNavigation = page.locator('#addMusicNavigation');
    this.table = page.locator('#musicList');
    this.names = page.locator('#musicList tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.count = page.locator('#statistics td[data-nav="count"]');
    this.mediaCount = page.locator('#statistics td[data-nav="mediaCount"]');
    this.songsCount = page.locator('#statistics td[data-nav="songsCount"]');
    // noinspection DuplicatedCode
    this.totalLength = page.locator('#statistics td[data-nav="totalLength"]');
    // noinspection DuplicatedCode
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(): Promise<void> {
    await this.page.goto('/music');
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  async search(name: string): Promise<void> {
    await this.searchName.fill(name);
    await this.searchButton.click();
  }

  row(name: string): Locator {
    return this.page.locator('#musicList tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: name})});
  }

  async openDetail(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="name"] a').click();
  }

  async openSongs(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="songs"] a').click();
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

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/music$/);
    await expect(this.heading).toBeVisible();
  }

}
