import { expect, type Locator, type Page } from '@playwright/test';

export class SeasonDetailPage {

  readonly heading: Locator;
  readonly episodesLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Season detail'});
    this.episodesLink = page.locator('tbody tr td[colspan="2"] a', {hasText: /^Episodes$/});
  }

  async goto(showUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/shows/${showUuid}/seasons/${uuid}/detail`);
  }

  row(title: string): Locator {
    return this.page.locator('tbody tr').filter({has: this.page.locator('td.title', {hasText: new RegExp(`^${title}$`)})});
  }

  value(title: string): Locator {
    return this.row(title).locator('td').nth(1);
  }

  async expectOpen(showUuid: string, uuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/shows/${showUuid}/seasons/${uuid}/detail$`));
    await expect(this.heading).toBeVisible();
  }

}
