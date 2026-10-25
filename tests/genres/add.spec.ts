import { genreApi } from '../../api/resources/GenreApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GenreFormPage } from '../../pages/genres/GenreFormPage';
import { GenreListPage } from '../../pages/genres/GenreListPage';
import { LoginPage } from '../../pages/LoginPage';
import { uniqueName } from '../../utils/testData';

test.describe('add genre (/genres/add)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/genres/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const genreFormPage = new GenreFormPage(authedPage);
    await genreFormPage.gotoAdd();

    await genreFormPage.expectAddOpen();
    await expect(genreFormPage.name).toHaveValue('');
    await expect(genreFormPage.cancelButton).toBeVisible();
  });

  test('adds a genre and stores it in BE', async ({authedPage}) => {
    const name = uniqueName('Genre');
    try {
      const genreListPage = new GenreListPage(authedPage);
      const genreFormPage = new GenreFormPage(authedPage);
      await genreListPage.goto();
      await genreListPage.openAdd();
      await genreFormPage.expectAddOpen();
      await genreFormPage.create(name);

      await genreListPage.expectOpen();
      await genreListPage.search(name);
      await genreListPage.expectRowCount(name, 1);
      const genres = await genreApi.search(name);
      expect(genres).toHaveLength(1);
      expect(genres[0].name).toBe(name);
    } finally {
      await genreApi.deleteByName(name);
    }
  });

  test('adds a genre with the maximum field values', async ({authedPage}) => {
    const name = uniqueName('Genre').padEnd(200, 'a');
    try {
      const genreListPage = new GenreListPage(authedPage);
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoAdd();
      await genreFormPage.create(name);

      await genreListPage.expectOpen();
      expect(await genreApi.search(name)).toHaveLength(1);
    } finally {
      await genreApi.deleteByName(name);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const name = uniqueName('Genre');
    const genreListPage = new GenreListPage(authedPage);
    const genreFormPage = new GenreFormPage(authedPage);
    await genreFormPage.gotoAdd();
    await genreFormPage.name.fill(name);
    await genreFormPage.cancel();

    await genreListPage.expectOpen();
    expect(await genreApi.search(name)).toHaveLength(0);
  });

  test('shows main menu and genre menu', async ({authedPage}) => {
    const genreListPage = new GenreListPage(authedPage);
    await new GenreFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(genreListPage.listNavigation).toBeVisible();
    await expect(genreListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const genreFormPage = new GenreFormPage(authedPage);
    await genreFormPage.gotoAdd();
    await genreFormPage.create('');

    await genreFormPage.expectError('Name is required');
    await genreFormPage.expectAddOpen();
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const name = 'a'.repeat(201);
    const genreFormPage = new GenreFormPage(authedPage);
    await genreFormPage.gotoAdd();
    await genreFormPage.create(name);

    await genreFormPage.expectError('Maximum length of name is 200');
    await genreFormPage.expectAddOpen();
    expect(await genreApi.search(name)).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const name = uniqueName('Genre');
    try {
      const genreListPage = new GenreListPage(authedPage);
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoAdd();
      await genreFormPage.create('');
      await genreFormPage.expectError('Name is required');
      await genreFormPage.create(name);

      await genreFormPage.expectNoError('Name is required');
      await genreListPage.expectOpen();
    } finally {
      await genreApi.deleteByName(name);
    }
  });

});
