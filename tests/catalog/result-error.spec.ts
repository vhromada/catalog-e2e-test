import { genreApi } from '../../api/resources/GenreApi';
import { expect, test } from '../../fixtures/test';
import { GenreFormPage } from '../../pages/genres/GenreFormPage';
import { GenreListPage } from '../../pages/genres/GenreListPage';
import { LoginPage } from '../../pages/LoginPage';
import { ResultErrorModal } from '../../pages/ResultErrorModal';
import { mockResponse } from '../../utils/mock';
import { credentials, genreRequest, INVALID_UUID } from '../../utils/testData';

const GENRES = /\/rest\/genres(\/[^/]+)?(\?.*)?$/;

test.describe('error of BE (result error modal)', () => {

  test('shows the error when a list cannot be loaded', async ({authedPage}) => {
    await mockResponse(authedPage, GENRES, 'GET', 500, {errors: [{code: 'SERVER_ERROR'}]});
    await authedPage.goto('/genres');

    const modal = new ResultErrorModal(authedPage);
    await modal.expectOpen('500');
    await expect(modal.message).toContainText('500');
    await expect(new GenreListPage(authedPage).table).toHaveCount(0);
  });

  test('closes the error with the close button', async ({authedPage}) => {
    await mockResponse(authedPage, GENRES, 'GET', 500);
    await authedPage.goto('/genres');
    const modal = new ResultErrorModal(authedPage);
    await modal.expectOpen();
    await modal.close();

    await modal.expectClosed();
  });

  test('closes the error with the cross', async ({authedPage}) => {
    await mockResponse(authedPage, GENRES, 'GET', 500);
    await authedPage.goto('/genres');
    const modal = new ResultErrorModal(authedPage);
    await modal.expectOpen();
    await modal.closeWithCross();

    await modal.expectClosed();
  });

  test('closes the error with the escape key', async ({authedPage}) => {
    await mockResponse(authedPage, GENRES, 'GET', 500);
    await authedPage.goto('/genres');
    const modal = new ResultErrorModal(authedPage);
    await modal.expectOpen();
    await modal.closeWithEscape();

    await modal.expectClosed();
  });

  test('shows the error again after a failed action following the closed error', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      const modal = new ResultErrorModal(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);
      await genreListPage.expectRowCount(genre.name, 1);
      await mockResponse(authedPage, GENRES, 'DELETE', 500);
      await genreListPage.remove(genre.name);
      await modal.expectOpen('500');
      await modal.close();
      await modal.expectClosed();
      await genreListPage.remove(genre.name);

      await modal.expectOpen('500');
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('shows the error when an item cannot be removed', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);
      await genreListPage.expectRowCount(genre.name, 1);
      await mockResponse(authedPage, GENRES, 'DELETE', 500);
      await genreListPage.remove(genre.name);

      await new ResultErrorModal(authedPage).expectOpen('500');
      expect(await genreApi.get(genre.uuid)).toBeTruthy();
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('shows the error when an item cannot be duplicated', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);
      await genreListPage.expectRowCount(genre.name, 1);
      await mockResponse(authedPage, /\/rest\/genres\/[^/]+\/duplicate$/, 'POST', 500);
      await genreListPage.duplicate(genre.name);

      await new ResultErrorModal(authedPage).expectOpen('500');
      expect(await genreApi.search(genre.name)).toHaveLength(1);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('shows the error when an item cannot be added and keeps the form', async ({authedPage}) => {
    await mockResponse(authedPage, GENRES, 'POST', 500);
    const genreFormPage = new GenreFormPage(authedPage);
    await genreFormPage.gotoAdd();
    await genreFormPage.create('Genre E2E failed add');

    await new ResultErrorModal(authedPage).expectOpen('500');
    await genreFormPage.expectAddOpen();
    await expect(genreFormPage.name).toHaveValue('Genre E2E failed add');
  });

  test('shows the error when an item cannot be updated and keeps the form', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoEdit(genre.uuid);
      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await mockResponse(authedPage, GENRES, 'PUT', 500);
      await genreFormPage.update('Genre E2E failed update');

      await new ResultErrorModal(authedPage).expectOpen('500');
      await genreFormPage.expectEditOpen(genre.uuid, 'Genre E2E failed update');
      expect((await genreApi.get(genre.uuid)).name).toBe(genre.name);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('shows the error when the login fails for another reason than wrong credentials', async ({page, testUser}) => {
    await mockResponse(page, /\/rest\/accounts\/credentials\/check$/, 'POST', 500);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.username, testUser.password);

    await new ResultErrorModal(page).expectOpen('500');
    await loginPage.expectOpen();
    await loginPage.expectNoError('Wrong username or password');
  });

  test('shows the error when the registration fails', async ({page}) => {
    await mockResponse(page, /\/rest\/accounts\/credentials$/, 'POST', 500);
    await page.goto('/registration');
    const creds = credentials();
    await page.locator('#username').fill(creds.username);
    await page.locator('#password').fill(creds.password);
    await page.locator('#copyPassword').fill(creds.password);
    await page.locator('#submit').click();

    await new ResultErrorModal(page).expectOpen('500');
    await expect(page).toHaveURL(/\/registration$/);
  });

  test('shows the error for an item which does not exist in BE', async ({authedPage}) => {
    await authedPage.goto(`/genres/${INVALID_UUID}`);

    await new ResultErrorModal(authedPage).expectOpen('404');
    await expect(new GenreFormPage(authedPage).name).toHaveCount(0);
  });

});
