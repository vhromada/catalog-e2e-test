import { expect, type Locator, type Page } from '@playwright/test';

export class PictureListPage {

  readonly heading: Locator;
  readonly listNavigation: Locator;
  readonly addNavigation: Locator;
  readonly table: Locator;
  readonly images: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Pictures'});
    this.listNavigation = page.locator('#pictureListNavigation');
    this.addNavigation = page.locator('#addPictureNavigation');
    this.table = page.locator('#pictures');
    this.images = page.locator('#pictures tbody td[data-nav="image"] img');
    // noinspection DuplicatedCode
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(): Promise<void> {
    await this.page.goto('/pictures');
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  row(uuid: string): Locator {
    return this.page.locator('#pictures tbody tr').filter({has: this.page.locator(`td[data-nav="image"] img[src$="/${uuid}"]`)});
  }

  async gotoRow(uuid: string): Promise<void> {
    await this.goto();
    await expect(this.table).toBeVisible();
    while (await this.row(uuid).count() === 0) {
      await expect(this.next).toBeVisible();
      await this.next.click();
    }
    await expect(this.row(uuid)).toHaveCount(1);
  }

  async remove(uuid: string): Promise<void> {
    await this.row(uuid).locator('td[data-nav="remove"] a').click();
  }

  async expectRowCount(uuid: string, count: number): Promise<void> {
    await expect(this.row(uuid)).toHaveCount(count);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pictures$/);
    await expect(this.heading).toBeVisible();
  }

}
