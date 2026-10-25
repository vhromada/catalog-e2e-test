import { expect, type Locator, type Page } from '@playwright/test';

export class BookItemListPage {

  readonly heading: Locator;
  readonly listNavigation: Locator;
  readonly addNavigation: Locator;
  readonly table: Locator;
  readonly noData: Locator;
  readonly formats: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Book items'});
    this.listNavigation = page.locator('#bookItemListNavigation');
    this.addNavigation = page.locator('#addBookItemNavigation');
    this.table = page.locator('#bookItems');
    this.noData = page.locator('#noData');
    this.formats = page.locator('#bookItems tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(bookUuid: string): Promise<void> {
    await this.page.goto(`/books/${bookUuid}/items`);
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  row(format: string): Locator {
    return this.page.locator('#bookItems tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: new RegExp(`^\\s*${format}\\s*$`)})});
  }

  async openDetail(format: string): Promise<void> {
    await this.row(format).first().locator('td[data-nav="name"] a').click();
  }

  async edit(format: string): Promise<void> {
    await this.row(format).first().locator('td[data-nav="edit"] a').click();
  }

  async duplicate(format: string): Promise<void> {
    await this.row(format).first().locator('td[data-nav="duplicate"] a').click();
  }

  async remove(format: string): Promise<void> {
    await this.row(format).first().locator('td[data-nav="remove"] a').click();
  }

  async expectRowCount(format: string, count: number): Promise<void> {
    await expect(this.row(format)).toHaveCount(count);
  }

  async expectPage(info: string): Promise<void> {
    await expect(this.pageInfo).toHaveText(info);
  }

  async expectOpen(bookUuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/books/${bookUuid}/items$`));
    await expect(this.heading).toBeVisible();
  }

}
