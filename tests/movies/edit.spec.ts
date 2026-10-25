import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { movieApi } from '../../api/resources/MovieApi';
import { pictureApi } from '../../api/resources/PictureApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MovieFormPage } from '../../pages/movies/MovieFormPage';
import { MovieListPage } from '../../pages/movies/MovieListPage';
import { genreRequest, INVALID_UUID, movieRequest, pictureContent, uniqueName } from '../../utils/testData';

const currentYear = new Date().getFullYear();

test.describe('edit movie (/movies/:uuid)', () => {

  let genre: Genre;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
  });

  test.afterEach(async () => {
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/movies/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the movie from BE', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid], {
      year: 2001,
      languages: ['CZ', 'EN'],
      subtitles: ['EN'],
      media: [65, 3725],
      csfd: 'csfd',
      imdbCode: 123,
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      note: 'Note'
    }));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);

      await movieFormPage.expectEditOpen(movie.uuid, {
        czechName: movie.czechName,
        originalName: movie.originalName,
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
      });
      await expect(movieFormPage.cancelButton).toBeVisible();
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('prefills the picture of the movie', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const movie = await movieApi.create(movieRequest([genre.uuid], {picture}));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);

      await expect(movieFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
      await expect(movieFormPage.removePictureButton).toBeVisible();
    } finally {
      await movieApi.delete(movie.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('preselects the picture of the movie in the picture modal', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const movie = await movieApi.create(movieRequest([genre.uuid], {picture}));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
      await movieFormPage.openPictureModal();

      await expect(movieFormPage.pictureOption(picture)).toBeChecked();
      await expect(movieFormPage.pictureModalChooseButton).toBeVisible();
    } finally {
      await movieApi.delete(movie.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('keeps the picture of the movie when the picture modal is closed', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const movie = await movieApi.create(movieRequest([genre.uuid], {picture}));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
      await movieFormPage.openPictureModal();
      await movieFormPage.closePictureModalWithCross();

      await expect(movieFormPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
    } finally {
      await movieApi.delete(movie.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('updates the movie and stores it in BE', async ({authedPage}) => {
    const second = await genreApi.create(genreRequest());
    const movie = await movieApi.create(movieRequest([genre.uuid], {note: 'Note'}));
    const czechName = uniqueName('Movie CZ');
    const originalName = uniqueName('Movie EN');
    try {
      const movieListPage = new MovieListPage(authedPage);
      const movieFormPage = new MovieFormPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: movie.czechName});
      await movieListPage.edit(movie.czechName);
      await movieFormPage.expectEditOpen(movie.uuid, {
        czechName: movie.czechName,
        originalName: movie.originalName,
        year: 2000,
        languages: ['EN'],
        media: [60],
        note: 'Note',
        genres: [genre.uuid]
      });
      await movieFormPage.update({
        czechName,
        originalName,
        year: 2010,
        languages: ['CZ', 'FR'],
        subtitles: ['CZ'],
        media: [100, 200],
        csfd: 'new_csfd',
        imdbCode: 456,
        wikiCz: 'New_CZ',
        wikiEn: 'New_EN',
        note: 'New note',
        genres: [second.uuid]
      });

      await movieListPage.expectOpen();
      await movieListPage.search({czechName});
      await movieListPage.expectRowCount(czechName, 1);
      const updated = await movieApi.get(movie.uuid);
      expect(updated).toMatchObject({
        uuid: movie.uuid,
        czechName,
        originalName,
        year: 2010,
        subtitles: ['CZ'],
        csfd: 'new_csfd',
        imdbCode: 456,
        wikiCz: 'New_CZ',
        wikiEn: 'New_EN',
        note: 'New note',
        genres: [second]
      });
      expect([...updated.languages].sort()).toEqual(['CZ', 'FR']);
      expect(updated.media.map((medium) => medium.length)).toEqual([100, 200]);
    } finally {
      await movieApi.delete(movie.uuid);
      await genreApi.delete(second.uuid);
    }
  });

  test('changes and removes the picture', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await movieFormPage.expectEditOpen(movie.uuid, {
        czechName: movie.czechName,
        originalName: movie.originalName,
        year: 2000,
        languages: ['EN'],
        media: [60],
        genres: [genre.uuid]
      });
      await movieFormPage.choosePicture(picture);
      await movieFormPage.updateButton.click();

      await new MovieListPage(authedPage).expectOpen();
      expect((await movieApi.get(movie.uuid)).picture).toBe(picture);

      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.picture).toBeVisible();
      await movieFormPage.removePicture();
      await movieFormPage.updateButton.click();

      await new MovieListPage(authedPage).expectOpen();
      expect((await movieApi.get(movie.uuid)).picture).toBeFalsy();
    } finally {
      await movieApi.delete(movie.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('removes a medium', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid], {media: [10, 20]}));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.mediumHours(1)).toBeVisible();
      await movieFormPage.removeMediumButton(1).click();
      await movieFormPage.updateButton.click();

      await new MovieListPage(authedPage).expectOpen();
      expect((await movieApi.get(movie.uuid)).media.map((medium) => medium.length)).toEqual([10]);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('clears the optional fields', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid], {subtitles: ['EN'], csfd: 'csfd', wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', note: 'Note'}));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await movieFormPage.expectEditOpen(movie.uuid, {
        czechName: movie.czechName,
        originalName: movie.originalName,
        year: 2000,
        languages: ['EN'],
        subtitles: ['EN'],
        media: [60],
        csfd: 'csfd',
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        note: 'Note',
        genres: [genre.uuid]
      });
      await movieFormPage.update({
        czechName: movie.czechName,
        originalName: movie.originalName,
        year: 2000,
        languages: ['EN'],
        media: [60],
        genres: [genre.uuid]
      });

      await new MovieListPage(authedPage).expectOpen();
      const updated = await movieApi.get(movie.uuid);
      expect(updated.subtitles).toEqual([]);
      expect(updated.csfd).toBeFalsy();
      expect(updated.wikiCz).toBeFalsy();
      expect(updated.wikiEn).toBeFalsy();
      expect(updated.note).toBeFalsy();
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('clears the IMDB code', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid], {imdbCode: 123}));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.imdbCode).toHaveValue('123');
      await movieFormPage.update({
        czechName: movie.czechName,
        originalName: movie.originalName,
        year: 2000,
        languages: ['EN'],
        media: [60],
        genres: [genre.uuid]
      });

      await new MovieListPage(authedPage).expectOpen();
      expect((await movieApi.get(movie.uuid)).imdbCode).toBeFalsy();
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('saving without changes keeps the movie unchanged', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid], {subtitles: ['CZ'], csfd: 'csfd', imdbCode: 123, wikiCz: 'Wiki_CZ', media: [65, 70], note: 'Note'}));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await movieFormPage.expectEditOpen(movie.uuid, {
        czechName: movie.czechName,
        originalName: movie.originalName,
        year: 2000,
        languages: ['EN'],
        subtitles: ['CZ'],
        media: [65, 70],
        csfd: 'csfd',
        imdbCode: 123,
        wikiCz: 'Wiki_CZ',
        note: 'Note',
        genres: [genre.uuid]
      });
      await movieFormPage.updateButton.click();

      await new MovieListPage(authedPage).expectOpen();
      expect(await movieApi.get(movie.uuid)).toEqual(movie);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.czechName).toHaveValue(movie.czechName);
      await movieFormPage.czechName.fill(uniqueName('Movie CZ'));
      await movieFormPage.cancel();

      await new MovieListPage(authedPage).expectOpen();
      expect((await movieApi.get(movie.uuid)).czechName).toBe(movie.czechName);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('shows main menu and movie menu', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await new MovieFormPage(authedPage).gotoEdit(movie.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(movieListPage.listNavigation).toBeVisible();
      await expect(movieListPage.addNavigation).toBeVisible();
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.czechName).toHaveValue(movie.czechName);
      await movieFormPage.update({czechName: '', originalName: '', year: '', languages: [], media: [0], genres: []});

      await movieFormPage.expectError('Czech name is required');
      await movieFormPage.expectError('Original name is required');
      await movieFormPage.expectError('Year is required');
      await movieFormPage.expectError('At least 1 language is required');
      await movieFormPage.expectError('Length must be at least 1 second');
      await movieFormPage.expectError('At least 1 genre is required');
      expect(await movieApi.get(movie.uuid)).toEqual(movie);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('shows errors when fields are invalid', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.czechName).toHaveValue(movie.czechName);
      await movieFormPage.update({
        czechName: 'a'.repeat(201),
        originalName: 'b'.repeat(201),
        year: currentYear + 1,
        languages: ['EN'],
        media: [60],
        csfd: 'c'.repeat(101),
        imdbCode: 1000000000,
        wikiCz: 'd'.repeat(101),
        wikiEn: 'e'.repeat(101),
        note: 'f'.repeat(101),
        genres: [genre.uuid]
      });

      await movieFormPage.expectError('Maximum length of czech name is 200');
      await movieFormPage.expectError('Maximum length of original name is 200');
      await movieFormPage.expectError(`Maximum value of year is ${currentYear}`);
      await movieFormPage.expectError('Maximum length of ČSFD is 100');
      await movieFormPage.expectError('Maximum value of IMDB is 999999999');
      await movieFormPage.expectError('Maximum length of Czech Wikipedia is 100');
      await movieFormPage.expectError('Maximum length of English Wikipedia is 100');
      await movieFormPage.expectError('Maximum length of note is 100');
      expect(await movieApi.get(movie.uuid)).toEqual(movie);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    const czechName = uniqueName('Movie CZ');
    const values = {originalName: movie.originalName, year: 2000, languages: ['EN'], media: [60], genres: [genre.uuid]};
    try {
      const movieListPage = new MovieListPage(authedPage);
      const movieFormPage = new MovieFormPage(authedPage);
      await movieFormPage.gotoEdit(movie.uuid);
      await expect(movieFormPage.czechName).toHaveValue(movie.czechName);
      await movieFormPage.update({...values, czechName: ''});
      await movieFormPage.expectError('Czech name is required');
      await movieFormPage.update({...values, czechName});

      await movieFormPage.expectNoError('Czech name is required');
      await movieListPage.expectOpen();
      expect((await movieApi.get(movie.uuid)).czechName).toBe(czechName);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

});
