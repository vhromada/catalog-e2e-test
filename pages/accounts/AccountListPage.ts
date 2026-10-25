import { expect, type Locator, type Page } from '@playwright/test';

export class AccountListPage {

  readonly heading: Locator;
  readonly searchUsername: Locator;
  readonly searchButton: Locator;
  readonly table: Locator;
  readonly usernames: Locator;
  readonly count: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Accounts'});
    this.searchUsername = page.locator('form #username');
    this.searchButton = page.locator('#search');
    this.table = page.locator('#accounts');
    this.usernames = page.locator('#accounts tbody td[data-nav="username"]');
    // noinspection DuplicatedCode
    this.count = page.locator('#statistics td[data-nav="count"]');
    // noinspection DuplicatedCode
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(): Promise<void> {
    await this.page.goto('/accounts');
  }

  async search(username: string): Promise<void> {
    await this.searchUsername.fill(username);
    await this.searchButton.click();
  }

  row(username: string): Locator {
    return this.page.locator('#accounts tbody tr').filter({has: this.page.locator('td[data-nav="username"]', {hasText: username})});
  }

  roles(username: string): Locator {
    return this.row(username).first().locator('td[data-nav="roles"]');
  }

  async editRoles(username: string): Promise<void> {
    await this.row(username).first().locator('td[data-nav="edit"] a').click();
  }

  async expectRowCount(username: string, count: number): Promise<void> {
    await expect(this.row(username)).toHaveCount(count);
  }

  async expectPage(info: string): Promise<void> {
    await expect(this.pageInfo).toHaveText(info);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/accounts$/);
    await expect(this.heading).toBeVisible();
  }

}
