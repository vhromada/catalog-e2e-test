import { expect, type Locator, type Page } from '@playwright/test';

export class CatalogPage {

  readonly catalogNavigation: Locator;
  readonly moviesNavigation: Locator;
  readonly showsNavigation: Locator;
  readonly gamesNavigation: Locator;
  readonly musicNavigation: Locator;
  readonly programsNavigation: Locator;
  readonly authorsNavigation: Locator;
  readonly booksNavigation: Locator;
  readonly jokesNavigation: Locator;
  readonly genresNavigation: Locator;
  readonly picturesNavigation: Locator;
  readonly accountsNavigation: Locator;
  readonly editAccountNavigation: Locator;
  readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.catalogNavigation = page.locator('#catalogNavigation');
    this.moviesNavigation = page.locator('#moviesNavigation');
    this.showsNavigation = page.locator('#showsNavigation');
    this.gamesNavigation = page.locator('#gamesNavigation');
    this.musicNavigation = page.locator('#musicNavigation');
    this.programsNavigation = page.locator('#programsNavigation');
    this.authorsNavigation = page.locator('#authorsNavigation');
    this.booksNavigation = page.locator('#booksNavigation');
    this.jokesNavigation = page.locator('#jokesNavigation');
    this.genresNavigation = page.locator('#genresNavigation');
    this.picturesNavigation = page.locator('#picturesNavigation');
    this.accountsNavigation = page.locator('#accountsNavigation');
    this.editAccountNavigation = page.locator('#editAccountNavigation');
    this.logoutLink = page.locator('#logout');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async openCatalog(): Promise<void> {
    await this.catalogNavigation.click();
  }

  async openAuthors(): Promise<void> {
    await this.authorsNavigation.click();
  }

  async openBooks(): Promise<void> {
    await this.booksNavigation.click();
  }

  async openPrograms(): Promise<void> {
    await this.programsNavigation.click();
  }

  async openGames(): Promise<void> {
    await this.gamesNavigation.click();
  }

  async openMovies(): Promise<void> {
    await this.moviesNavigation.click();
  }

  async openShows(): Promise<void> {
    await this.showsNavigation.click();
  }

  async openMusic(): Promise<void> {
    await this.musicNavigation.click();
  }

  async openJokes(): Promise<void> {
    await this.jokesNavigation.click();
  }

  async openPictures(): Promise<void> {
    await this.picturesNavigation.click();
  }

  async openGenres(): Promise<void> {
    await this.genresNavigation.click();
  }

  async openAccounts(): Promise<void> {
    await this.accountsNavigation.click();
  }

  async openEditAccount(): Promise<void> {
    await this.editAccountNavigation.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  async expectMainMenu(): Promise<void> {
    await expect(this.catalogNavigation).toBeVisible();
    await expect(this.moviesNavigation).toBeVisible();
    await expect(this.showsNavigation).toBeVisible();
    await expect(this.gamesNavigation).toBeVisible();
    await expect(this.musicNavigation).toBeVisible();
    await expect(this.programsNavigation).toBeVisible();
    await expect(this.authorsNavigation).toBeVisible();
    await expect(this.booksNavigation).toBeVisible();
    await expect(this.jokesNavigation).toBeVisible();
    await expect(this.genresNavigation).toBeVisible();
    await expect(this.picturesNavigation).toBeVisible();
    await expect(this.accountsNavigation).toHaveCount(0);
    await expect(this.editAccountNavigation).toBeVisible();
    await expect(this.logoutLink).toBeVisible();
  }

  async expectAdminMenu(): Promise<void> {
    await expect(this.catalogNavigation).toBeVisible();
    await expect(this.moviesNavigation).toBeVisible();
    await expect(this.picturesNavigation).toBeVisible();
    await expect(this.accountsNavigation).toBeVisible();
    await expect(this.editAccountNavigation).toBeVisible();
    await expect(this.logoutLink).toBeVisible();
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/$/);
    await expect(this.logoutLink).toBeVisible();
  }

}
