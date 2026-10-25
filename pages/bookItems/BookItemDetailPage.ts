import { expect, type Locator, type Page } from '@playwright/test';

export class BookItemDetailPage {

  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Book item detail'});
  }

  async goto(bookUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/books/${bookUuid}/items/${uuid}/detail`);
  }

  row(title: string): Locator {
    return this.page.locator('tbody tr').filter({has: this.page.locator('td.title', {hasText: new RegExp(`^${title}$`)})});
  }

  value(title: string): Locator {
    return this.row(title).locator('td').nth(1);
  }

  async expectOpen(bookUuid: string, uuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/books/${bookUuid}/items/${uuid}/detail$`));
    await expect(this.heading).toBeVisible();
  }

}
