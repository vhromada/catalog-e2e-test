import { genreApi } from '../../api/resources/GenreApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GenreFormPage } from '../../pages/genres/GenreFormPage';
import { GenreListPage } from '../../pages/genres/GenreListPage';
import { LoginPage } from '../../pages/LoginPage';
import { genreRequest, INVALID_UUID, uniqueName } from '../../utils/testData';

test.describe('edit genre (/genres/:uuid)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/genres/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the genre from BE', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoEdit(genre.uuid);

      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await expect(genreFormPage.cancelButton).toBeVisible();
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('updates the genre and stores it in BE', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    const newName = uniqueName('Genre');
    try {
      const genreListPage = new GenreListPage(authedPage);
      const genreFormPage = new GenreFormPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);
      await genreListPage.edit(genre.name);
      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await genreFormPage.update(newName);

      await genreListPage.expectOpen();
      await genreListPage.search(newName);
      await genreListPage.expectRowCount(newName, 1);
      expect((await genreApi.get(genre.uuid)).name).toBe(newName);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('updates the genre with the maximum field values', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    const newName = uniqueName('Genre').padEnd(200, 'a');
    try {
      const genreListPage = new GenreListPage(authedPage);
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoEdit(genre.uuid);
      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await genreFormPage.update(newName);

      await genreListPage.expectOpen();
      expect((await genreApi.get(genre.uuid)).name).toBe(newName);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('saving without changes keeps the genre unchanged', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoEdit(genre.uuid);
      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await genreFormPage.updateButton.click();

      await genreListPage.expectOpen();
      expect(await genreApi.get(genre.uuid)).toEqual(genre);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoEdit(genre.uuid);
      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await genreFormPage.name.fill(uniqueName('Genre'));
      await genreFormPage.cancel();

      await genreListPage.expectOpen();
      expect((await genreApi.get(genre.uuid)).name).toBe(genre.name);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('shows main menu and genre menu', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await new GenreFormPage(authedPage).gotoEdit(genre.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(genreListPage.listNavigation).toBeVisible();
      await expect(genreListPage.addNavigation).toBeVisible();
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoEdit(genre.uuid);
      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await genreFormPage.update('');

      await genreFormPage.expectError('Name is required');
      await genreFormPage.expectEditOpen(genre.uuid, '');
      expect((await genreApi.get(genre.uuid)).name).toBe(genre.name);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoEdit(genre.uuid);
      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await genreFormPage.update('a'.repeat(201));

      await genreFormPage.expectError('Maximum length of name is 200');
      await genreFormPage.expectEditOpen(genre.uuid, 'a'.repeat(201));
      expect((await genreApi.get(genre.uuid)).name).toBe(genre.name);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    const newName = uniqueName('Genre');
    try {
      const genreListPage = new GenreListPage(authedPage);
      const genreFormPage = new GenreFormPage(authedPage);
      await genreFormPage.gotoEdit(genre.uuid);
      await genreFormPage.expectEditOpen(genre.uuid, genre.name);
      await genreFormPage.update('');
      await genreFormPage.expectError('Name is required');
      await genreFormPage.update(newName);

      await genreFormPage.expectNoError('Name is required');
      await genreListPage.expectOpen();
      expect((await genreApi.get(genre.uuid)).name).toBe(newName);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

});
