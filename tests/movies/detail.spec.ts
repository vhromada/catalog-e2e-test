import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { movieApi } from '../../api/resources/MovieApi';
import { pictureApi } from '../../api/resources/PictureApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MovieDetailPage } from '../../pages/movies/MovieDetailPage';
import { MovieListPage } from '../../pages/movies/MovieListPage';
import { genreRequest, INVALID_UUID, movieRequest, pictureContent } from '../../utils/testData';

test.describe('movie detail (/movies/:uuid/detail)', () => {

  let genre: Genre;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
  });

  test.afterEach(async () => {
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/movies/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the movie from BE', async ({authedPage}) => {
    const second = await genreApi.create(genreRequest());
    const movie = await movieApi.create(movieRequest([genre.uuid, second.uuid], {
      year: 2001,
      languages: ['CZ', 'EN'],
      subtitles: ['EN'],
      media: [65, 3600],
      csfd: 'csfd',
      imdbCode: 123,
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      note: 'Note'
    }));
    try {
      const movieDetailPage = new MovieDetailPage(authedPage);
      await movieDetailPage.goto(movie.uuid);

      await movieDetailPage.expectOpen(movie.uuid);
      await expect(movieDetailPage.value('Czech name')).toHaveText(movie.czechName);
      await expect(movieDetailPage.value('Original name')).toHaveText(movie.originalName);
      await expect(movieDetailPage.value('Genres')).toContainText(genre.name);
      await expect(movieDetailPage.value('Genres')).toContainText(second.name);
      await expect(movieDetailPage.value('Year')).toHaveText('2001');
      await expect(movieDetailPage.value('Languages')).toContainText('Czech');
      await expect(movieDetailPage.value('Languages')).toContainText('English');
      await expect(movieDetailPage.value('Subtitles')).toHaveText('English');
      await expect(movieDetailPage.value('Media')).toHaveText('0:01:05, 1:00:00');
      await expect(movieDetailPage.value('Total length')).toHaveText('1:01:05');
      await expect(movieDetailPage.value('Note')).toHaveText('Note');
      await expect(movieDetailPage.csfdLink).toHaveAttribute('href', 'https://www.csfd.cz/film/csfd');
      await expect(movieDetailPage.imdbLink).toHaveAttribute('href', 'https://www.imdb.com/title/tt0000123');
      await expect(movieDetailPage.wikiCzLink).toHaveAttribute('href', 'https://cz.wikipedia.org/wiki/Wiki_CZ');
      await expect(movieDetailPage.wikiEnLink).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Wiki_EN');
    } finally {
      await movieApi.delete(movie.uuid);
      await genreApi.delete(second.uuid);
    }
  });

  test('shows the picture of the movie', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const movie = await movieApi.create(movieRequest([genre.uuid], {picture}));
    try {
      const movieDetailPage = new MovieDetailPage(authedPage);
      await movieDetailPage.goto(movie.uuid);

      await expect(movieDetailPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
    } finally {
      await movieApi.delete(movie.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('hides the optional fields when they are not set', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieDetailPage = new MovieDetailPage(authedPage);
      await movieDetailPage.goto(movie.uuid);

      await expect(movieDetailPage.value('Czech name')).toHaveText(movie.czechName);
      await expect(movieDetailPage.picture).toHaveCount(0);
      await expect(movieDetailPage.row('Subtitles')).toHaveCount(0);
      await expect(movieDetailPage.row('Note')).toHaveCount(0);
      await expect(movieDetailPage.csfdLink).toHaveCount(0);
      await expect(movieDetailPage.imdbLink).toHaveCount(0);
      await expect(movieDetailPage.wikiCzLink).toHaveCount(0);
      await expect(movieDetailPage.wikiEnLink).toHaveCount(0);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('shows main menu and movie menu', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await new MovieDetailPage(authedPage).goto(movie.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(movieListPage.listNavigation).toBeVisible();
      await expect(movieListPage.addNavigation).toBeVisible();
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

});
