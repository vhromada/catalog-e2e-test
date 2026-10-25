import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { movieApi } from '../../api/resources/MovieApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MovieDetailPage } from '../../pages/movies/MovieDetailPage';
import { MovieFormPage } from '../../pages/movies/MovieFormPage';
import { MovieListPage } from '../../pages/movies/MovieListPage';
import { genreRequest, ITEMS_PER_PAGE, movieRequest, pagesCount } from '../../utils/testData';

test.describe('movie list (/movies)', () => {

  let genre: Genre;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
  });

  test.afterEach(async () => {
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/movies');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading, search form and statistics', async ({authedPage}) => {
    const movieListPage = new MovieListPage(authedPage);
    await movieListPage.goto();

    await movieListPage.expectOpen();
    await expect(movieListPage.searchCzechName).toBeVisible();
    await expect(movieListPage.searchOriginalName).toBeVisible();
    await expect(movieListPage.searchButton).toBeVisible();
    await expect(movieListPage.count).toHaveText(/\d+/);
    await expect(movieListPage.mediaCount).toHaveText(/\d+/);
    await expect(movieListPage.totalLength).toHaveText(/\d+:\d{2}:\d{2}/);
  });

  // The DB is shared with tests running in parallel, so the BE data is compared only when it did not change while the FE was loading.
  test('shows statistics from BE', async ({authedPage}) => {
    const movieListPage = new MovieListPage(authedPage);

    await expect(async () => {
      const before = await movieApi.statistics();
      await movieListPage.goto();
      await expect(movieListPage.count).toHaveText(/\d+/);
      const shown = [
        await movieListPage.count.innerText(),
        await movieListPage.mediaCount.innerText(),
        await movieListPage.totalLength.innerText()
      ];
      const after = await movieApi.statistics();

      expect(after).toEqual(before);
      expect(shown).toEqual([String(before.count), String(before.mediaCount), before.length]);
    }).toPass();
  });

  test('shows first page of movies from BE', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);

      await expect(async () => {
        const before = await movieApi.list(1, ITEMS_PER_PAGE);
        const {count} = await movieApi.statistics();
        await movieListPage.goto();
        await expect(movieListPage.table).toBeVisible();
        const shown = await movieListPage.names.allInnerTexts();
        const pageInfo = await movieListPage.pageInfo.allInnerTexts();
        const after = await movieApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => item.czechName));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('shows movies stored in BE', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: movie.czechName});

      await movieListPage.expectRowCount(movie.czechName, 1);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('searches movies by czech name', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    const other = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: movie.czechName});

      await movieListPage.expectRowCount(movie.czechName, 1);
      await movieListPage.expectRowCount(other.czechName, 0);
    } finally {
      await movieApi.delete(movie.uuid);
      await movieApi.delete(other.uuid);
    }
  });

  test('searches movies by original name', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    const other = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({originalName: movie.originalName});

      await movieListPage.expectRowCount(movie.czechName, 1);
      await movieListPage.expectRowCount(other.czechName, 0);
    } finally {
      await movieApi.delete(movie.uuid);
      await movieApi.delete(other.uuid);
    }
  });

  test('shows no table when search finds nothing', async ({authedPage}) => {
    const movieListPage = new MovieListPage(authedPage);
    await movieListPage.goto();
    await movieListPage.search({czechName: movieRequest([genre.uuid]).czechName});

    await expect(movieListPage.table).toHaveCount(0);
  });

  test('shows main menu and movie menu', async ({authedPage}) => {
    const movieListPage = new MovieListPage(authedPage);
    await movieListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(movieListPage.listNavigation).toBeVisible();
    await expect(movieListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const movieListPage = new MovieListPage(authedPage);
    await movieListPage.goto();
    await movieListPage.openAdd();

    await new MovieFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const movieListPage = new MovieListPage(authedPage);
    await new MovieFormPage(authedPage).gotoAdd();
    await movieListPage.openList();

    await movieListPage.expectOpen();
  });

  test('opens detail of the movie', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: movie.czechName});
      await movieListPage.openDetail(movie.czechName);

      await new MovieDetailPage(authedPage).expectOpen(movie.uuid);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('opens edit form with the movie', async ({authedPage}) => {
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
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: movie.czechName});
      await movieListPage.edit(movie.czechName);

      await new MovieFormPage(authedPage).expectEditOpen(movie.uuid, {
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
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('duplicates a movie', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid], {languages: ['CZ'], subtitles: ['EN'], media: [90, 30], note: 'Note'}));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: movie.czechName});
      await movieListPage.duplicate(movie.czechName);

      await movieListPage.expectRowCount(movie.czechName, 2);
      const movies = await movieApi.search(movie.czechName);
      expect(movies).toHaveLength(2);
      for (const item of movies) {
        expect(item).toMatchObject({czechName: movie.czechName, originalName: movie.originalName, languages: ['CZ'], subtitles: ['EN'], note: 'Note'});
        expect(item.media.map((medium) => medium.length)).toEqual([90, 30]);
        expect(item.genres).toEqual([genre]);
      }
    } finally {
      await movieApi.deleteByCzechName(movie.czechName);
    }
  });

  test('removes a movie', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: movie.czechName});
      await movieListPage.remove(movie.czechName);

      await movieListPage.expectRowCount(movie.czechName, 0);
      expect(await movieApi.search(movie.czechName)).toHaveLength(0);
    } finally {
      await movieApi.deleteByCzechName(movie.czechName);
    }
  });

  test('does not show paging for a single page of results', async ({authedPage}) => {
    const movie = await movieApi.create(movieRequest([genre.uuid]));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: movie.czechName});

      await movieListPage.expectRowCount(movie.czechName, 1);
      await expect(movieListPage.pageInfo).toHaveCount(0);
    } finally {
      await movieApi.delete(movie.uuid);
    }
  });

  test('pages through search results', async ({authedPage}) => {
    const prefix = movieRequest([genre.uuid]).czechName;
    const movies = await Promise.all(Array.from({length: ITEMS_PER_PAGE + 1}, (_, i) => movieApi.create(movieRequest([genre.uuid], {czechName: `${prefix} ${i}`}))));
    try {
      const movieListPage = new MovieListPage(authedPage);
      await movieListPage.goto();
      await movieListPage.search({czechName: prefix});

      await movieListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await movieListPage.expectPage('1 / 2');
      await expect(movieListPage.first).toHaveCount(0);
      await expect(movieListPage.previous).toHaveCount(0);

      await movieListPage.next.click();
      await movieListPage.expectRowCount(prefix, 1);
      await movieListPage.expectPage('2 / 2');
      await expect(movieListPage.next).toHaveCount(0);
      await expect(movieListPage.last).toHaveCount(0);

      await movieListPage.previous.click();
      await movieListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await movieListPage.expectPage('1 / 2');

      await movieListPage.last.click();
      await movieListPage.expectRowCount(prefix, 1);
      await movieListPage.expectPage('2 / 2');

      await movieListPage.first.click();
      await movieListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await movieListPage.expectPage('1 / 2');
    } finally {
      await Promise.all(movies.map((movie) => movieApi.delete(movie.uuid)));
    }
  });

});
