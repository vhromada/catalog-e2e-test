import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { pictureApi } from '../../api/resources/PictureApi';
import { showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { ShowFormPage } from '../../pages/shows/ShowFormPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { genreRequest, pictureContent, uniqueName } from '../../utils/testData';

test.describe('add show (/shows/add)', () => {

  let genre: Genre;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
  });

  test.afterEach(async () => {
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/shows/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const showFormPage = new ShowFormPage(authedPage);
    await showFormPage.gotoAdd();

    await showFormPage.expectAddOpen();
    await expect(showFormPage.czechName).toHaveValue('');
    await expect(showFormPage.originalName).toHaveValue('');
    await expect(showFormPage.csfd).toHaveValue('');
    await expect(showFormPage.imdbCode).toHaveValue('');
    await expect(showFormPage.wikiCz).toHaveValue('');
    await expect(showFormPage.wikiEn).toHaveValue('');
    await expect(showFormPage.note).toHaveValue('');
    await expect(showFormPage.picture).toHaveCount(0);
    await expect(showFormPage.choosePictureButton).toBeVisible();
    await expect(showFormPage.genres).toBeVisible();
    expect(await showFormPage.selectedGenres()).toEqual([]);
    await expect(showFormPage.cancelButton).toBeVisible();
  });

  test('lists the genres from BE in the select', async ({authedPage}) => {
    const showFormPage = new ShowFormPage(authedPage);
    await showFormPage.gotoAdd();

    await expect(showFormPage.genres.locator(`option[value="${genre.uuid}"]`)).toHaveText(genre.name);
  });

  test('adds a show and stores it in BE', async ({authedPage}) => {
    const czechName = uniqueName('Show CZ');
    const values = {
      czechName,
      originalName: uniqueName('Show EN'),
      csfd: 'csfd',
      imdbCode: 123,
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      note: 'Note',
      genres: [genre.uuid]
    };
    try {
      const showListPage = new ShowListPage(authedPage);
      const showFormPage = new ShowFormPage(authedPage);
      await showListPage.goto();
      await showListPage.openAdd();
      await showFormPage.expectAddOpen();
      await showFormPage.create(values);

      await showListPage.expectOpen();
      await showListPage.search({czechName});
      await showListPage.expectRowCount(czechName, 1);
      const shows = await showApi.search(czechName);
      expect(shows).toHaveLength(1);
      expect(shows[0]).toMatchObject({...values, genres: [genre], seasonsCount: 0, episodesCount: 0, length: 0});
    } finally {
      await showApi.deleteByCzechName(czechName);
    }
  });

  test('adds a show with more genres and only the required fields', async ({authedPage}) => {
    const second = await genreApi.create(genreRequest());
    const czechName = uniqueName('Show CZ');
    try {
      const showListPage = new ShowListPage(authedPage);
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoAdd();
      await showFormPage.create({czechName, originalName: uniqueName('Show EN'), genres: [genre.uuid, second.uuid]});

      await showListPage.expectOpen();
      const shows = await showApi.search(czechName);
      expect(shows).toHaveLength(1);
      expect(shows[0].genres.map((item) => item.uuid).sort()).toEqual([genre.uuid, second.uuid].sort());
      expect(shows[0].csfd).toBeFalsy();
      expect(shows[0].imdbCode).toBeFalsy();
      expect(shows[0].wikiCz).toBeFalsy();
      expect(shows[0].wikiEn).toBeFalsy();
      expect(shows[0].picture).toBeFalsy();
      expect(shows[0].note).toBeFalsy();
    } finally {
      await showApi.deleteByCzechName(czechName);
      await genreApi.delete(second.uuid);
    }
  });

  test('adds a show with the maximum field values', async ({authedPage}) => {
    const czechName = uniqueName('Show CZ').padEnd(200, 'a');
    const originalName = uniqueName('Show EN').padEnd(200, 'b');
    try {
      const showListPage = new ShowListPage(authedPage);
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoAdd();
      await showFormPage.create({
        czechName,
        originalName,
        csfd: 'c'.repeat(100),
        imdbCode: 999999999,
        wikiCz: 'd'.repeat(100),
        wikiEn: 'e'.repeat(100),
        note: 'f'.repeat(100),
        genres: [genre.uuid]
      });

      await showListPage.expectOpen();
      const shows = await showApi.search(czechName);
      expect(shows).toHaveLength(1);
      expect(shows[0]).toMatchObject({
        czechName,
        originalName,
        csfd: 'c'.repeat(100),
        imdbCode: 999999999,
        wikiCz: 'd'.repeat(100),
        wikiEn: 'e'.repeat(100),
        note: 'f'.repeat(100)
      });
    } finally {
      await showApi.deleteByCzechName(czechName);
    }
  });

  test('adds a show with a chosen picture', async ({authedPage}) => {
    const czechName = uniqueName('Show CZ');
    const picture = await pictureApi.createAndFind(pictureContent());
    try {
      const showListPage = new ShowListPage(authedPage);
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoAdd();
      await showFormPage.choosePicture(picture);
      await expect(showFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
      await showFormPage.create({czechName, originalName: uniqueName('Show EN'), genres: [genre.uuid]});

      await showListPage.expectOpen();
      const shows = await showApi.search(czechName);
      expect(shows).toHaveLength(1);
      expect(shows[0].picture).toBe(picture);
    } finally {
      await showApi.deleteByCzechName(czechName);
      await pictureApi.delete(picture);
    }
  });

  test('removes the chosen picture', async ({authedPage}) => {
    const czechName = uniqueName('Show CZ');
    const picture = await pictureApi.createAndFind(pictureContent());
    try {
      const showListPage = new ShowListPage(authedPage);
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoAdd();
      await showFormPage.choosePicture(picture);
      await showFormPage.removePicture();
      await expect(showFormPage.picture).toHaveCount(0);
      await showFormPage.create({czechName, originalName: uniqueName('Show EN'), genres: [genre.uuid]});

      await showListPage.expectOpen();
      const shows = await showApi.search(czechName);
      expect(shows).toHaveLength(1);
      expect(shows[0].picture).toBeFalsy();
    } finally {
      await showApi.deleteByCzechName(czechName);
      await pictureApi.delete(picture);
    }
  });

  test('lists the pictures from BE in the picture modal', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoAdd();
      await showFormPage.openPictureModal();

      await expect(showFormPage.pictureOption(picture)).toBeVisible();
      await expect(showFormPage.pictureOption(picture)).not.toBeChecked();
      await expect(showFormPage.pictureModalChooseButton).toHaveCount(0);
    } finally {
      await pictureApi.delete(picture);
    }
  });

  test('shows the choose button of the picture modal after a picture is selected', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoAdd();
      await showFormPage.openPictureModal();
      await showFormPage.pictureOption(picture).check();

      await expect(showFormPage.pictureModalChooseButton).toBeVisible();
    } finally {
      await pictureApi.delete(picture);
    }
  });

  test('closes the picture modal with the cross without choosing a picture', async ({authedPage}) => {
    const showFormPage = new ShowFormPage(authedPage);
    await showFormPage.gotoAdd();
    await showFormPage.openPictureModal();
    await showFormPage.closePictureModalWithCross();

    await expect(showFormPage.picture).toHaveCount(0);
    await showFormPage.expectAddOpen();
  });

  test('closes the picture modal with the escape key without choosing a picture', async ({authedPage}) => {
    const showFormPage = new ShowFormPage(authedPage);
    await showFormPage.gotoAdd();
    await showFormPage.openPictureModal();
    await showFormPage.closePictureModalWithEscape();

    await expect(showFormPage.picture).toHaveCount(0);
    await showFormPage.expectAddOpen();
  });

  test('changes the chosen picture', async ({authedPage}) => {
    const first = await pictureApi.createAndFind(pictureContent());
    const second = await pictureApi.createAndFind(pictureContent());
    try {
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoAdd();
      await showFormPage.choosePicture(first);
      await showFormPage.choosePicture(second);

      await expect(showFormPage.picture).toHaveAttribute('src', new RegExp(`/${second}$`));
    } finally {
      await pictureApi.delete(first);
      await pictureApi.delete(second);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const czechName = uniqueName('Show CZ');
    const showListPage = new ShowListPage(authedPage);
    const showFormPage = new ShowFormPage(authedPage);
    await showFormPage.gotoAdd();
    await showFormPage.czechName.fill(czechName);
    await showFormPage.cancel();

    await showListPage.expectOpen();
    expect(await showApi.search(czechName)).toHaveLength(0);
  });

  test('shows main menu and show menu', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    await new ShowFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const showFormPage = new ShowFormPage(authedPage);
    await showFormPage.gotoAdd();
    await expect(showFormPage.genres).toBeVisible();
    await showFormPage.createButton.click();

    await showFormPage.expectError('Czech name is required');
    await showFormPage.expectError('Original name is required');
    await showFormPage.expectError('At least 1 genre is required');
    await showFormPage.expectNoError('Note is required');
    await showFormPage.expectAddOpen();
  });

  test('shows errors when IMDB code is out of range', async ({authedPage}) => {
    const czechName = uniqueName('Show CZ');
    const showFormPage = new ShowFormPage(authedPage);
    await showFormPage.gotoAdd();
    await showFormPage.create({czechName, originalName: uniqueName('Show EN'), imdbCode: 0, genres: [genre.uuid]});

    await showFormPage.expectError('Minimum value of IMDB is 1');
    await showFormPage.expectAddOpen();

    await showFormPage.create({czechName, originalName: uniqueName('Show EN'), imdbCode: 1000000000, genres: [genre.uuid]});

    await showFormPage.expectError('Maximum value of IMDB is 999999999');
    await showFormPage.expectAddOpen();
    expect(await showApi.search(czechName)).toHaveLength(0);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const czechName = 'a'.repeat(201);
    const showFormPage = new ShowFormPage(authedPage);
    await showFormPage.gotoAdd();
    await showFormPage.create({
      czechName,
      originalName: 'b'.repeat(201),
      csfd: 'c'.repeat(101),
      wikiCz: 'd'.repeat(101),
      wikiEn: 'e'.repeat(101),
      note: 'f'.repeat(101),
      genres: [genre.uuid]
    });

    await showFormPage.expectError('Maximum length of czech name is 200');
    await showFormPage.expectError('Maximum length of original name is 200');
    await showFormPage.expectError('Maximum length of ČSFD is 100');
    await showFormPage.expectError('Maximum length of Czech Wikipedia is 100');
    await showFormPage.expectError('Maximum length of English Wikipedia is 100');
    await showFormPage.expectError('Maximum length of note is 100');
    await showFormPage.expectAddOpen();
    expect(await showApi.search(czechName)).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const czechName = uniqueName('Show CZ');
    try {
      const showListPage = new ShowListPage(authedPage);
      const showFormPage = new ShowFormPage(authedPage);
      await showFormPage.gotoAdd();
      await expect(showFormPage.genres).toBeVisible();
      await showFormPage.createButton.click();
      await showFormPage.expectError('Czech name is required');
      await showFormPage.create({czechName, originalName: uniqueName('Show EN'), genres: [genre.uuid]});

      await showFormPage.expectNoError('Czech name is required');
      await showListPage.expectOpen();
      expect(await showApi.search(czechName)).toHaveLength(1);
    } finally {
      await showApi.deleteByCzechName(czechName);
    }
  });

});
