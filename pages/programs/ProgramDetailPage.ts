import { expect, type Locator, type Page } from '@playwright/test';

export class ProgramDetailPage {

  readonly heading: Locator;
  readonly wikiCzLink: Locator;
  readonly wikiEnLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Program detail'});
    this.wikiCzLink = page.locator('tbody tr td[colspan="2"] a', {hasText: 'Czech Wikipedia'});
    this.wikiEnLink = page.locator('tbody tr td[colspan="2"] a', {hasText: 'English Wikipedia'});
  }

  async goto(uuid: string): Promise<void> {
    await this.page.goto(`/programs/${uuid}/detail`);
  }

  row(title: string): Locator {
    return this.page.locator('tbody tr').filter({has: this.page.locator('td.title', {hasText: new RegExp(`^${title}$`)})});
  }

  value(title: string): Locator {
    return this.row(title).locator('td').nth(1);
  }

  async expectOpen(uuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/programs/${uuid}/detail$`));
    await expect(this.heading).toBeVisible();
  }

}
