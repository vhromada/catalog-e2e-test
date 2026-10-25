import { expect, type Locator, type Page } from '@playwright/test';

export class JokeListPage {

  readonly heading: Locator;
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
    this.heading = page.getByRole('heading', {name: 'Jokes'});
    this.listNavigation = page.locator('#jokeListNavigation');
    this.addNavigation = page.locator('#addJokeNavigation');
    this.table = page.locator('#jokes');
    this.names = page.locator('#jokes tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.count = page.locator('#statistics td[data-nav="count"]');
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(): Promise<void> {
    await this.page.goto('/jokes');
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  row(content: string): Locator {
    return this.page.locator('#jokes tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: content})});
  }

  async gotoRow(content: string): Promise<void> {
    await this.goto();
    await expect(this.table).toBeVisible();
    while (await this.row(content).count() === 0) {
      await expect(this.next).toBeVisible();
      await this.next.click();
    }
    await expect(this.row(content)).toHaveCount(1);
  }

  async openDetail(content: string): Promise<void> {
    await this.row(content).first().locator('td[data-nav="name"] a').click();
  }

  async edit(content: string): Promise<void> {
    await this.row(content).first().locator('td[data-nav="edit"] a').click();
  }

  async remove(content: string): Promise<void> {
    await this.row(content).first().locator('td[data-nav="remove"] a').click();
  }

  async expectRowCount(content: string, count: number): Promise<void> {
    await expect(this.row(content)).toHaveCount(count);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/jokes$/);
    await expect(this.heading).toBeVisible();
  }

}
