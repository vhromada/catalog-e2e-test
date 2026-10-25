import { expect, type Locator, type Page } from '@playwright/test';

export class BookDetailPage {

  readonly heading: Locator;
  readonly itemsLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Book detail'});
    this.itemsLink = page.locator('tbody tr td[colspan="2"] a');
  }

  async goto(uuid: string): Promise<void> {
    await this.page.goto(`/books/${uuid}/detail`);
  }

  row(title: string): Locator {
    return this.page.locator('tbody tr').filter({has: this.page.locator('td.title', {hasText: new RegExp(`^${title}$`)})});
  }

  value(title: string): Locator {
    return this.row(title).locator('td').nth(1);
  }

  async expectOpen(uuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/books/${uuid}/detail$`));
    await expect(this.heading).toBeVisible();
  }

}
