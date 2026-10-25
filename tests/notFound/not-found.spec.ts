import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('page not found (unknown route)', () => {

  test('shows the message and the way back to login for unauthenticated user', async ({page}) => {
    await page.goto('/unknown/page');

    await expect(page).toHaveURL(/\/unknown\/page$/);
    await expect(page.getByRole('heading', {name: 'Page not found'})).toBeVisible();
    await expect(page.locator('#catalogNavigation')).toHaveCount(0);
    await page.getByRole('link', {name: 'Back to login'}).click();

    await new LoginPage(page).expectOpen();
  });

  test('shows the message with the main menu for logged in user', async ({authedPage}) => {
    await authedPage.goto('/unknown/page');

    await expect(authedPage).toHaveURL(/\/unknown\/page$/);
    await expect(authedPage.getByRole('heading', {name: 'Page not found'})).toBeVisible();
    await new CatalogPage(authedPage).expectMainMenu();
    await expect(authedPage.getByRole('link', {name: 'Back to login'})).toHaveCount(0);
  });

  test('opens the catalog from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await authedPage.goto('/unknown/page');
    await catalogPage.catalogNavigation.click();

    await expect(authedPage).toHaveURL(/\/$/);
    await expect(authedPage.getByRole('heading', {name: 'Page not found'})).toHaveCount(0);
  });

});
