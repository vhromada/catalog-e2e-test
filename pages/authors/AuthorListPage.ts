import { expect, type Locator, type Page } from '@playwright/test';

export class AuthorListPage {

  readonly heading: Locator;
  readonly searchFirstName: Locator;
  readonly searchMiddleName: Locator;
  readonly searchLastName: Locator;
  readonly searchButton: Locator;
  readonly listNavigation: Locator;
  readonly addNavigation: Locator;
  readonly table: Locator;
  readonly names: Locator;
  readonly count: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Authors'});
    this.searchFirstName = page.locator('form #firstName');
    this.searchMiddleName = page.locator('form #middleName');
    this.searchLastName = page.locator('form #lastName');
    this.searchButton = page.locator('#search');
    this.listNavigation = page.locator('#authorListNavigation');
    this.addNavigation = page.locator('#addAuthorNavigation');
    this.table = page.locator('#authors');
    this.names = page.locator('#authors tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.count = page.locator('#statistics td[data-nav="count"]');
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(): Promise<void> {
    await this.page.goto('/authors');
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  async search(filter: { firstName?: string; middleName?: string; lastName?: string }): Promise<void> {
    await this.searchFirstName.fill(filter.firstName ?? '');
    await this.searchMiddleName.fill(filter.middleName ?? '');
    await this.searchLastName.fill(filter.lastName ?? '');
    await this.searchButton.click();
  }

  row(text: string): Locator {
    return this.page.locator('#authors tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: text})});
  }

  async edit(text: string): Promise<void> {
    await this.row(text).first().locator('td[data-nav="edit"] a').click();
  }

  async duplicate(text: string): Promise<void> {
    await this.row(text).first().locator('td[data-nav="duplicate"] a').click();
  }

  async remove(text: string): Promise<void> {
    await this.row(text).first().locator('td[data-nav="remove"] a').click();
  }

  async expectRowCount(text: string, count: number): Promise<void> {
    await expect(this.row(text)).toHaveCount(count);
  }

  async expectPage(info: string): Promise<void> {
    await expect(this.pageInfo).toHaveText(info);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/authors$/);
    await expect(this.heading).toBeVisible();
  }

}
