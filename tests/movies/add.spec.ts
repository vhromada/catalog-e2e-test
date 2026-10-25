import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { movieApi } from '../../api/resources/MovieApi';
import { pictureApi } from '../../api/resources/PictureApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MovieFormPage } from '../../pages/movies/MovieFormPage';
import { MovieListPage } from '../../pages/movies/MovieListPage';
import { genreRequest, pictureContent, uniqueName } from '../../utils/testData';

const currentYear = new Date().getFullYear();

test.describe('add movie (/movies/add)', () => {

  let genre: Genre;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
  });

  test.afterEach(async () => {
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/movies/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();

    await movieFormPage.expectAddOpen();
    await expect(movieFormPage.czechName).toHaveValue('');
    await expect(movieFormPage.originalName).toHaveValue('');
    await expect(movieFormPage.year).toHaveValue(String(currentYear));
    await expect(movieFormPage.languages).not.toHaveCount(0);
    expect(await movieFormPage.languages.evaluateAll((inputs: HTMLInputElement[]) => inputs.some((input) => input.checked))).toBe(false);
    expect(await movieFormPage.subtitles.evaluateAll((inputs: HTMLInputElement[]) => inputs.some((input) => input.checked))).toBe(false);
    await expect(movieFormPage.mediumHours(0)).toHaveValue('0');
    await expect(movieFormPage.mediumMinutes(0)).toHaveValue('0');
    await expect(movieFormPage.mediumSeconds(0)).toHaveValue('0');
    await expect(movieFormPage.mediumHours(1)).toHaveCount(0);
    await expect(movieFormPage.removeMediumButton(0)).toHaveCount(0);
    await expect(movieFormPage.csfd).toHaveValue('');
    await expect(movieFormPage.imdbCode).toHaveValue('');
    await expect(movieFormPage.wikiCz).toHaveValue('');
    await expect(movieFormPage.wikiEn).toHaveValue('');
    await expect(movieFormPage.note).toHaveValue('');
    await expect(movieFormPage.picture).toHaveCount(0);
    await expect(movieFormPage.choosePictureButton).toBeVisible();
    await expect(movieFormPage.genres).toBeVisible();
    expect(await movieFormPage.selectedGenres()).toEqual([]);
    await expect(movieFormPage.cancelButton).toBeVisible();
  });

  test('lists the genres from BE in the select', async ({authedPage}) => {
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();

    await expect(movieFormPage.genres.locator(`option[value="${genre.uuid}"]`)).toHaveText(genre.name);
  });

  test('adds a movie and stores it in BE', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ');
    const values = {
      czechName,
      originalName: uniqueName('Movie EN'),
      year: 2001,
      languages: ['CZ', 'EN'],
      subtitles: ['EN'],
      media: [65, 3725],
      csfd: 'csfd',
      imdbCode: 123,
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      note: 'Note',
      genres: [genre.uuid]
    };
    try {
      const movieListPage = new MovieListPage(authedPage);
      const movieFormPage = new MovieFormPage(authedPage);
      await movieListPage.goto();
      await movieListPage.openAdd();
      await movieFormPage.expectAddOpen();
      await movieFormPage.create(values);

      await movieListPage.expectOpen();
      await movieListPage.search({czechName});
      await movieListPage.expectRowCount(czechName, 1);
      const movies = await movieApi.search(czechName);
      expect(movies).toHaveLength(1);
      const {media, languages, subtitles, ...rest} = values;
      expect(movies[0]).toMatchObject({...rest, genres: [genre]});
      expect([...movies[0].languages].sort()).toEqual(languages);
      expect(movies[0].subtitles).toEqual(subtitles);
      expect(movies[0].media.map((medium) => medium.length)).toEqual(media);
    } finally {
      await movieApi.deleteByCzechName(czechName);
    }
  });

  test('adds a movie with more genres and only the required fields', async ({authedPage}) => {
    const second = await genreApi.create(genreRequest());
    const czechName = uniqueName('Movie CZ');
    try {
      const movieListPage = new MovieListPage(authedPage);
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await movieFormPage.create({
        czechName,
        originalName: uniqueName('Movie EN'),
        year: currentYear,
        languages: ['EN'],
        media: [1],
        genres: [genre.uuid, second.uuid]
      });

      await movieListPage.expectOpen();
      const movies = await movieApi.search(czechName);
      expect(movies).toHaveLength(1);
      expect(movies[0].genres.map((item) => item.uuid).sort()).toEqual([genre.uuid, second.uuid].sort());
      expect(movies[0]).toMatchObject({year: currentYear, languages: ['EN'], subtitles: []});
      expect(movies[0].csfd).toBeFalsy();
      expect(movies[0].imdbCode).toBeFalsy();
      expect(movies[0].wikiCz).toBeFalsy();
      expect(movies[0].wikiEn).toBeFalsy();
      expect(movies[0].picture).toBeFalsy();
      expect(movies[0].note).toBeFalsy();
    } finally {
      await movieApi.deleteByCzechName(czechName);
      await genreApi.delete(second.uuid);
    }
  });

  test('adds and removes media', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ');
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await movieFormPage.addMedium();
      await movieFormPage.addMedium();
      await expect(movieFormPage.mediumHours(2)).toBeVisible();
      await expect(movieFormPage.removeMediumButton(0)).toHaveCount(0);
      await movieFormPage.removeMediumButton(2).click();
      await expect(movieFormPage.mediumHours(2)).toHaveCount(0);
      await movieFormPage.create({czechName, originalName: uniqueName('Movie EN'), year: currentYear, languages: ['EN'], media: [10, 20], genres: [genre.uuid]});

      await new MovieListPage(authedPage).expectOpen();
      const movies = await movieApi.search(czechName);
      expect(movies).toHaveLength(1);
      expect(movies[0].media.map((medium) => medium.length)).toEqual([10, 20]);
    } finally {
      await movieApi.deleteByCzechName(czechName);
    }
  });

  test('adds a movie with the maximum field values', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ').padEnd(200, 'a');
    const originalName = uniqueName('Movie EN').padEnd(100, 'b');
    try {
      const movieListPage = new MovieListPage(authedPage);
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await movieFormPage.create({
        czechName,
        originalName,
        year: currentYear,
        languages: ['EN'],
        media: [86399],
        csfd: 'c'.repeat(100),
        imdbCode: 999999999,
        wikiCz: 'd'.repeat(100),
        wikiEn: 'e'.repeat(100),
        note: 'f'.repeat(100),
        genres: [genre.uuid]
      });

      await movieListPage.expectOpen();
      const movies = await movieApi.search(czechName);
      expect(movies).toHaveLength(1);
      expect(movies[0]).toMatchObject({
        czechName,
        originalName,
        csfd: 'c'.repeat(100),
        imdbCode: 999999999,
        wikiCz: 'd'.repeat(100),
        wikiEn: 'e'.repeat(100),
        note: 'f'.repeat(100)
      });
    } finally {
      await movieApi.deleteByCzechName(czechName);
    }
  });

  test('adds a movie with a chosen picture', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ');
    const picture = await pictureApi.createAndFind(pictureContent());
    try {
      const movieListPage = new MovieListPage(authedPage);
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await movieFormPage.choosePicture(picture);
      await expect(movieFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
      await movieFormPage.create({czechName, originalName: uniqueName('Movie EN'), year: currentYear, languages: ['EN'], media: [60], genres: [genre.uuid]});

      await movieListPage.expectOpen();
      const movies = await movieApi.search(czechName);
      expect(movies).toHaveLength(1);
      expect(movies[0].picture).toBe(picture);
    } finally {
      await movieApi.deleteByCzechName(czechName);
      await pictureApi.delete(picture);
    }
  });

  test('removes the chosen picture', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ');
    const picture = await pictureApi.createAndFind(pictureContent());
    try {
      const movieListPage = new MovieListPage(authedPage);
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await movieFormPage.choosePicture(picture);
      await movieFormPage.removePicture();
      await expect(movieFormPage.picture).toHaveCount(0);
      await movieFormPage.create({czechName, originalName: uniqueName('Movie EN'), year: currentYear, languages: ['EN'], media: [60], genres: [genre.uuid]});

      await movieListPage.expectOpen();
      const movies = await movieApi.search(czechName);
      expect(movies).toHaveLength(1);
      expect(movies[0].picture).toBeFalsy();
    } finally {
      await movieApi.deleteByCzechName(czechName);
      await pictureApi.delete(picture);
    }
  });

  test('lists the pictures from BE in the picture modal', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await movieFormPage.openPictureModal();

      await expect(movieFormPage.pictureOption(picture)).toBeVisible();
      await expect(movieFormPage.pictureOption(picture)).not.toBeChecked();
      await expect(movieFormPage.pictureModalChooseButton).toHaveCount(0);
    } finally {
      await pictureApi.delete(picture);
    }
  });

  test('shows the choose button of the picture modal after a picture is selected', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await movieFormPage.openPictureModal();
      await movieFormPage.pictureOption(picture).check();

      await expect(movieFormPage.pictureModalChooseButton).toBeVisible();
    } finally {
      await pictureApi.delete(picture);
    }
  });

  test('closes the picture modal with the cross without choosing a picture', async ({authedPage}) => {
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();
    await movieFormPage.openPictureModal();
    await movieFormPage.closePictureModalWithCross();

    await expect(movieFormPage.picture).toHaveCount(0);
    await movieFormPage.expectAddOpen();
  });

  test('closes the picture modal with the escape key without choosing a picture', async ({authedPage}) => {
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();
    await movieFormPage.openPictureModal();
    await movieFormPage.closePictureModalWithEscape();

    await expect(movieFormPage.picture).toHaveCount(0);
    await movieFormPage.expectAddOpen();
  });

  test('changes the chosen picture', async ({authedPage}) => {
    const first = await pictureApi.createAndFind(pictureContent());
    const second = await pictureApi.createAndFind(pictureContent());
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await movieFormPage.choosePicture(first);
      await movieFormPage.choosePicture(second);

      await expect(movieFormPage.picture).toHaveAttribute('src', new RegExp(`/${second}$`));
    } finally {
      await pictureApi.delete(first);
      await pictureApi.delete(second);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ');
    const movieListPage = new MovieListPage(authedPage);
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();
    await movieFormPage.czechName.fill(czechName);
    await movieFormPage.cancel();

    await movieListPage.expectOpen();
    expect(await movieApi.search(czechName)).toHaveLength(0);
  });

  test('shows main menu and movie menu', async ({authedPage}) => {
    const movieListPage = new MovieListPage(authedPage);
    await new MovieFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(movieListPage.listNavigation).toBeVisible();
    await expect(movieListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();
    await expect(movieFormPage.genres).toBeVisible();
    await movieFormPage.year.fill('');
    await movieFormPage.createButton.click();

    await movieFormPage.expectError('Czech name is required');
    await movieFormPage.expectError('Original name is required');
    await movieFormPage.expectError('Year is required');
    await movieFormPage.expectError('At least 1 language is required');
    await movieFormPage.expectError('Length must be at least 1 second');
    await movieFormPage.expectError('At least 1 genre is required');
    await movieFormPage.expectNoError('Note is required');
    await movieFormPage.expectAddOpen();
  });

  test('shows errors when year is out of range', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ');
    const values = {czechName, originalName: uniqueName('Movie EN'), languages: ['EN'], media: [60], genres: [genre.uuid]};
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();
    await movieFormPage.create({...values, year: 1929});

    await movieFormPage.expectError('Minimum value of year is 1930');
    await movieFormPage.expectAddOpen();

    await movieFormPage.create({...values, year: currentYear + 1});

    await movieFormPage.expectError(`Maximum value of year is ${currentYear}`);
    await movieFormPage.expectAddOpen();
    expect(await movieApi.search(czechName)).toHaveLength(0);
  });

  test('shows errors when IMDB code is out of range', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ');
    const values = {czechName, originalName: uniqueName('Movie EN'), year: currentYear, languages: ['EN'], media: [60], genres: [genre.uuid]};
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();
    await movieFormPage.create({...values, imdbCode: 0});

    await movieFormPage.expectError('Minimum value of IMDB is 1');
    await movieFormPage.expectAddOpen();

    await movieFormPage.create({...values, imdbCode: 1000000000});

    await movieFormPage.expectError('Maximum value of IMDB is 999999999');
    await movieFormPage.expectAddOpen();
    expect(await movieApi.search(czechName)).toHaveLength(0);
  });

  test('shows errors when medium length is out of range', async ({authedPage}) => {
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();
    await movieFormPage.fillMedium(0, 24, 60, 60);
    await movieFormPage.createButton.click();

    await movieFormPage.expectError('Maximum value of hours is 23');
    await movieFormPage.expectError('Maximum value of minutes is 59');
    await movieFormPage.expectError('Maximum value of seconds is 59');
    await movieFormPage.expectAddOpen();
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const czechName = 'a'.repeat(201);
    const movieFormPage = new MovieFormPage(authedPage);
    await movieFormPage.gotoAdd();
    await movieFormPage.create({
      czechName,
      originalName: 'b'.repeat(201),
      year: currentYear,
      languages: ['EN'],
      media: [60],
      csfd: 'c'.repeat(101),
      wikiCz: 'd'.repeat(101),
      wikiEn: 'e'.repeat(101),
      note: 'f'.repeat(101),
      genres: [genre.uuid]
    });

    await movieFormPage.expectError('Maximum length of czech name is 200');
    await movieFormPage.expectError('Maximum length of original name is 200');
    await movieFormPage.expectError('Maximum length of ČSFD is 100');
    await movieFormPage.expectError('Maximum length of Czech Wikipedia is 100');
    await movieFormPage.expectError('Maximum length of English Wikipedia is 100');
    await movieFormPage.expectError('Maximum length of note is 100');
    await movieFormPage.expectAddOpen();
    expect(await movieApi.search(czechName)).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const czechName = uniqueName('Movie CZ');
    try {
      const movieListPage = new MovieListPage(authedPage);
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoAdd();
      await expect(movieFormPage.genres).toBeVisible();
      await movieFormPage.createButton.click();
      await movieFormPage.expectError('Czech name is required');
      await movieFormPage.create({czechName, originalName: uniqueName('Movie EN'), year: currentYear, languages: ['EN'], media: [60], genres: [genre.uuid]});

      await movieFormPage.expectNoError('Czech name is required');
      await movieListPage.expectOpen();
      expect(await movieApi.search(czechName)).toHaveLength(1);
    } finally {
      await movieApi.deleteByCzechName(czechName);
    }
  });

});
