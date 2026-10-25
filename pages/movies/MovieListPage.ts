import { expect, type Locator, type Page } from '@playwright/test';

export class MovieListPage {

  readonly heading: Locator;
  readonly searchCzechName: Locator;
  readonly searchOriginalName: Locator;
  readonly searchButton: Locator;
  readonly listNavigation: Locator;
  readonly addNavigation: Locator;
  readonly table: Locator;
  readonly names: Locator;
  readonly count: Locator;
  readonly mediaCount: Locator;
  readonly totalLength: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Movies'});
    this.searchCzechName = page.locator('form #czechName');
    this.searchOriginalName = page.locator('form #originalName');
    this.searchButton = page.locator('#search');
    this.listNavigation = page.locator('#movieListNavigation');
    this.addNavigation = page.locator('#addMovieNavigation');
    this.table = page.locator('#movies');
    this.names = page.locator('#movies tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.count = page.locator('#statistics td[data-nav="count"]');
    this.mediaCount = page.locator('#statistics td[data-nav="mediaCount"]');
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
    await this.page.goto('/movies');
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  async search(filter: { czechName?: string; originalName?: string }): Promise<void> {
    await this.searchCzechName.fill(filter.czechName ?? '');
    await this.searchOriginalName.fill(filter.originalName ?? '');
    await this.searchButton.click();
  }

  row(czechName: string): Locator {
    return this.page.locator('#movies tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: czechName})});
  }

  async openDetail(czechName: string): Promise<void> {
    await this.row(czechName).first().locator('td[data-nav="name"] a').click();
  }

  async edit(czechName: string): Promise<void> {
    await this.row(czechName).first().locator('td[data-nav="edit"] a').click();
  }

  async duplicate(czechName: string): Promise<void> {
    await this.row(czechName).first().locator('td[data-nav="duplicate"] a').click();
  }

  async remove(czechName: string): Promise<void> {
    await this.row(czechName).first().locator('td[data-nav="remove"] a').click();
  }

  async expectRowCount(czechName: string, count: number): Promise<void> {
    await expect(this.row(czechName)).toHaveCount(count);
  }

  async expectPage(info: string): Promise<void> {
    await expect(this.pageInfo).toHaveText(info);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/movies$/);
    await expect(this.heading).toBeVisible();
  }

}
