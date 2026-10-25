import { expect, type Locator, type Page } from '@playwright/test';

export class JokeDetailPage {

  readonly heading: Locator;
  readonly content: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Joke detail'});
    this.content = page.locator('h2 + span');
  }

  async goto(uuid: string): Promise<void> {
    await this.page.goto(`/jokes/${uuid}/detail`);
  }

  async expectOpen(uuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/jokes/${uuid}/detail$`));
    await expect(this.heading).toBeVisible();
  }

}
