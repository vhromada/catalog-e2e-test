import { expect, type Locator, type Page } from '@playwright/test';

export class SongDetailPage {

  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Song detail'});
  }

  async goto(musicUuid: string, uuid: string): Promise<void> {
    await this.page.goto(`/music/${musicUuid}/songs/${uuid}/detail`);
  }

  row(title: string): Locator {
    return this.page.locator('tbody tr').filter({has: this.page.locator('td.title', {hasText: new RegExp(`^${title}$`)})});
  }

  value(title: string): Locator {
    return this.row(title).locator('td').nth(1);
  }

  async expectOpen(musicUuid: string, uuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/music/${musicUuid}/songs/${uuid}/detail$`));
    await expect(this.heading).toBeVisible();
  }

}
