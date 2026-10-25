import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { pictureApi } from '../../api/resources/PictureApi';
import { showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { ShowFormPage } from '../../pages/shows/ShowFormPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { genreRequest, INVALID_UUID, pictureContent, showRequest, uniqueName } from '../../utils/testData';

test.describe('edit show (/shows/:uuid)', () => {

  let genre: Genre;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
  });

  test.afterEach(async () => {
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/shows/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the show from BE', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid], {csfd: 'csfd', imdbCode: 123, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', note: 'Note'}));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);

      await showFormPage.expectEditOpen(show.uuid, {
        czechName: show.czechName,
        originalName: show.originalName,
        csfd: 'csfd',
        imdbCode: 123,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        note: 'Note',
        genres: [genre.uuid]
      });
      await expect(showFormPage.cancelButton).toBeVisible();
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('prefills the picture of the show', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const show = await showApi.create(showRequest([genre.uuid], {picture}));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);

      await expect(showFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
      await expect(showFormPage.removePictureButton).toBeVisible();
    } finally {
      await showApi.delete(show.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('preselects the picture of the show in the picture modal', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const show = await showApi.create(showRequest([genre.uuid], {picture}));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await expect(showFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
      await showFormPage.openPictureModal();

      await expect(showFormPage.pictureOption(picture)).toBeChecked();
      await expect(showFormPage.pictureModalChooseButton).toBeVisible();
    } finally {
      await showApi.delete(show.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('keeps the picture of the show when the picture modal is closed', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const show = await showApi.create(showRequest([genre.uuid], {picture}));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await expect(showFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
      await showFormPage.openPictureModal();
      await showFormPage.closePictureModalWithCross();

      await expect(showFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
    } finally {
      await showApi.delete(show.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('updates the show and stores it in BE', async ({authedPage}) => {
    const second = await genreApi.create(genreRequest());
    const show = await showApi.create(showRequest([genre.uuid], {note: 'Note'}));
    const czechName = uniqueName('Show CZ');
    const originalName = uniqueName('Show EN');
    try {
      const showListPage = new ShowListPage(authedPage);
      const showFormPage = new ShowFormPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});
      await showListPage.edit(show.czechName);
      await showFormPage.expectEditOpen(show.uuid, {czechName: show.czechName, originalName: show.originalName, note: 'Note', genres: [genre.uuid]});
      await showFormPage.update({
        czechName,
        originalName,
        csfd: 'new_csfd',
        imdbCode: 456,
        wikiCz: 'New_CZ',
        wikiEn: 'New_EN',
        note: 'New note',
        genres: [second.uuid]
      });

      await showListPage.expectOpen();
      await showListPage.search({czechName});
      await showListPage.expectRowCount(czechName, 1);
      expect(await showApi.get(show.uuid)).toEqual({
        ...show,
        czechName,
        originalName,
        csfd: 'new_csfd',
        imdbCode: 456,
        wikiCz: 'New_CZ',
        wikiEn: 'New_EN',
        note: 'New note',
        genres: [second]
      });
    } finally {
      await showApi.delete(show.uuid);
      await genreApi.delete(second.uuid);
    }
  });

  test('changes and removes the picture', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await showFormPage.expectEditOpen(show.uuid, {czechName: show.czechName, originalName: show.originalName, genres: [genre.uuid]});
      await showFormPage.choosePicture(picture);
      await showFormPage.updateButton.click();

      await new ShowListPage(authedPage).expectOpen();
      expect((await showApi.get(show.uuid)).picture).toBe(picture);

      await showFormPage.gotoEdit(show.uuid);
      await expect(showFormPage.picture).toBeVisible();
      await showFormPage.removePicture();
      await showFormPage.updateButton.click();

      await new ShowListPage(authedPage).expectOpen();
      expect((await showApi.get(show.uuid)).picture).toBeFalsy();
    } finally {
      await showApi.delete(show.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('clears the optional fields', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid], {csfd: 'csfd', imdbCode: 123, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', note: 'Note'}));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await showFormPage.expectEditOpen(show.uuid, {
        czechName: show.czechName,
        originalName: show.originalName,
        csfd: 'csfd',
        imdbCode: 123,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        note: 'Note',
        genres: [genre.uuid]
      });
      await showFormPage.update({czechName: show.czechName, originalName: show.originalName, genres: [genre.uuid]});

      await new ShowListPage(authedPage).expectOpen();
      const updated = await showApi.get(show.uuid);
      expect(updated.csfd).toBeFalsy();
      expect(updated.imdbCode).toBeFalsy();
      expect(updated.wikiCz).toBeFalsy();
      expect(updated.wikiEn).toBeFalsy();
      expect(updated.note).toBeFalsy();
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('saving without changes keeps the show unchanged', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid], {csfd: 'csfd', imdbCode: 123, wikiCz: 'Wiki_CZ', note: 'Note'}));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await showFormPage.expectEditOpen(show.uuid, {
        czechName: show.czechName,
        originalName: show.originalName,
        csfd: 'csfd',
        imdbCode: 123,
        wikiCz: 'Wiki_CZ',
        note: 'Note',
        genres: [genre.uuid]
      });
      await showFormPage.updateButton.click();

      await new ShowListPage(authedPage).expectOpen();
      expect(await showApi.get(show.uuid)).toEqual(show);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await showFormPage.expectEditOpen(show.uuid, {czechName: show.czechName, originalName: show.originalName, genres: [genre.uuid]});
      await showFormPage.czechName.fill(uniqueName('Show CZ'));
      await showFormPage.cancel();

      await new ShowListPage(authedPage).expectOpen();
      expect((await showApi.get(show.uuid)).czechName).toBe(show.czechName);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('shows main menu and show menu', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await new ShowFormPage(authedPage).gotoEdit(show.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(showListPage.listNavigation).toBeVisible();
      await expect(showListPage.addNavigation).toBeVisible();
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await showFormPage.expectEditOpen(show.uuid, {czechName: show.czechName, originalName: show.originalName, genres: [genre.uuid]});
      await showFormPage.update({czechName: '', originalName: '', genres: []});

      await showFormPage.expectError('Czech name is required');
      await showFormPage.expectError('Original name is required');
      await showFormPage.expectError('At least 1 genre is required');
      expect(await showApi.get(show.uuid)).toEqual(show);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('shows errors when fields are invalid', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await showFormPage.expectEditOpen(show.uuid, {czechName: show.czechName, originalName: show.originalName, genres: [genre.uuid]});
      await showFormPage.update({
        czechName: 'a'.repeat(201),
        originalName: 'b'.repeat(201),
        csfd: 'c'.repeat(101),
        imdbCode: 1000000000,
        wikiCz: 'd'.repeat(101),
        wikiEn: 'e'.repeat(101),
        note: 'f'.repeat(101),
        genres: [genre.uuid]
      });

      await showFormPage.expectError('Maximum length of czech name is 200');
      await showFormPage.expectError('Maximum length of original name is 200');
      await showFormPage.expectError('Maximum length of ČSFD is 100');
      await showFormPage.expectError('Maximum value of IMDB is 999999999');
      await showFormPage.expectError('Maximum length of Czech Wikipedia is 100');
      await showFormPage.expectError('Maximum length of English Wikipedia is 100');
      await showFormPage.expectError('Maximum length of note is 100');
      expect(await showApi.get(show.uuid)).toEqual(show);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    const czechName = uniqueName('Show CZ');
    try {
      const showListPage = new ShowListPage(authedPage);
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoEdit(show.uuid);
      await showFormPage.expectEditOpen(show.uuid, {czechName: show.czechName, originalName: show.originalName, genres: [genre.uuid]});
      await showFormPage.update({czechName: '', originalName: show.originalName, genres: [genre.uuid]});
      await showFormPage.expectError('Czech name is required');
      await showFormPage.update({czechName, originalName: show.originalName, genres: [genre.uuid]});

      await showFormPage.expectNoError('Czech name is required');
      await showListPage.expectOpen();
      expect((await showApi.get(show.uuid)).czechName).toBe(czechName);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

});
