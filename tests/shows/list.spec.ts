import { episodeApi } from '../../api/resources/EpisodeApi';
import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { seasonApi } from '../../api/resources/SeasonApi';
import { showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowDetailPage } from '../../pages/shows/ShowDetailPage';
import { ShowFormPage } from '../../pages/shows/ShowFormPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { episodeRequest, genreRequest, ITEMS_PER_PAGE, pagesCount, seasonRequest, showRequest } from '../../utils/testData';

test.describe('show list (/shows)', () => {

  let genre: Genre;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
  });

  test.afterEach(async () => {
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/shows');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading, search form and statistics', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    await showListPage.goto();

    await showListPage.expectOpen();
    await expect(showListPage.searchCzechName).toBeVisible();
    await expect(showListPage.searchOriginalName).toBeVisible();
    await expect(showListPage.searchButton).toBeVisible();
    await expect(showListPage.count).toHaveText(/\d+/);
    await expect(showListPage.seasonsCount).toHaveText(/\d+/);
    await expect(showListPage.episodesCount).toHaveText(/\d+/);
    await expect(showListPage.totalLength).toHaveText(/\d+:\d{2}:\d{2}/);
  });

  // The DB is shared with tests running in parallel, so the BE data is compared only when it did not change while the FE was loading.
  test('shows statistics from BE', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);

    await expect(async () => {
      const before = await showApi.statistics();
      await showListPage.goto();
      await expect(showListPage.count).toHaveText(/\d+/);
      const shown = [
        await showListPage.count.innerText(),
        await showListPage.seasonsCount.innerText(),
        await showListPage.episodesCount.innerText(),
        await showListPage.totalLength.innerText()
      ];
      const after = await showApi.statistics();

      expect(after).toEqual(before);
      expect(shown).toEqual([String(before.count), String(before.seasonsCount), String(before.episodesCount), before.length]);
    }).toPass();
  });

  test('shows first page of shows from BE', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);

      await expect(async () => {
        const before = await showApi.list(1, ITEMS_PER_PAGE);
        const {count} = await showApi.statistics();
        await showListPage.goto();
        await expect(showListPage.table).toBeVisible();
        const shown = await showListPage.names.allInnerTexts();
        const pageInfo = await showListPage.pageInfo.allInnerTexts();
        const after = await showApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => item.czechName));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('shows shows stored in BE', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});

      await showListPage.expectRowCount(show.czechName, 1);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('searches shows by czech name', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    const other = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});

      await showListPage.expectRowCount(show.czechName, 1);
      await showListPage.expectRowCount(other.czechName, 0);
    } finally {
      await showApi.delete(show.uuid);
      await showApi.delete(other.uuid);
    }
  });

  test('searches shows by original name', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    const other = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({originalName: show.originalName});

      await showListPage.expectRowCount(show.czechName, 1);
      await showListPage.expectRowCount(other.czechName, 0);
    } finally {
      await showApi.delete(show.uuid);
      await showApi.delete(other.uuid);
    }
  });

  test('shows no table when search finds nothing', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    await showListPage.goto();
    await showListPage.search({czechName: showRequest([genre.uuid]).czechName});

    await expect(showListPage.table).toHaveCount(0);
  });

  test('shows main menu and show menu', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    await showListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    await showListPage.goto();
    await showListPage.openAdd();

    await new ShowFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    await new ShowFormPage(authedPage).gotoAdd();
    await showListPage.openList();

    await showListPage.expectOpen();
  });

  test('opens detail of the show', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});
      await showListPage.openDetail(show.czechName);

      await new ShowDetailPage(authedPage).expectOpen(show.uuid);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('opens seasons of the show', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});
      await showListPage.openSeasons(show.czechName);

      await new SeasonListPage(authedPage).expectOpen(show.uuid);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('opens edit form with the show', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid], {csfd: 'csfd', imdbCode: 123, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', note: 'Note'}));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});
      await showListPage.edit(show.czechName);

      await new ShowFormPage(authedPage).expectEditOpen(show.uuid, {
        czechName: show.czechName,
        originalName: show.originalName,
        csfd: 'csfd',
        imdbCode: 123,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        note: 'Note',
        genres: [genre.uuid]
      });
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('duplicates a show with its seasons and episodes', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid], {note: 'Note'}));
    try {
      const season = await seasonApi.create(show.uuid, seasonRequest());
      await episodeApi.create(show.uuid, season.uuid, episodeRequest({length: 90}));
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});
      await showListPage.duplicate(show.czechName);

      await showListPage.expectRowCount(show.czechName, 2);
      const shows = await showApi.search(show.czechName);
      expect(shows).toHaveLength(2);
      for (const item of shows) {
        expect(item).toMatchObject({czechName: show.czechName, originalName: show.originalName, note: 'Note', seasonsCount: 1, episodesCount: 1, length: 90});
        expect(item.genres).toEqual([genre]);
      }
    } finally {
      await showApi.deleteByCzechName(show.czechName);
    }
  });

  test('removes a show', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});
      await showListPage.remove(show.czechName);

      await showListPage.expectRowCount(show.czechName, 0);
      expect(await showApi.search(show.czechName)).toHaveLength(0);
    } finally {
      await showApi.deleteByCzechName(show.czechName);
    }
  });

  test('does not show paging for a single page of results', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: show.czechName});

      await showListPage.expectRowCount(show.czechName, 1);
      await expect(showListPage.pageInfo).toHaveCount(0);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('pages through search results', async ({authedPage}) => {
    const prefix = showRequest([genre.uuid]).czechName;
    const shows = await Promise.all(Array.from({length: ITEMS_PER_PAGE + 1}, (_, i) => showApi.create(showRequest([genre.uuid], {czechName: `${prefix} ${i}`}))));
    try {
      const showListPage = new ShowListPage(authedPage);
      await showListPage.goto();
      await showListPage.search({czechName: prefix});

      await showListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await showListPage.expectPage('1 / 2');
      await expect(showListPage.first).toHaveCount(0);
      await expect(showListPage.previous).toHaveCount(0);

      await showListPage.next.click();
      await showListPage.expectRowCount(prefix, 1);
      await showListPage.expectPage('2 / 2');
      await expect(showListPage.next).toHaveCount(0);
      await expect(showListPage.last).toHaveCount(0);

      await showListPage.previous.click();
      await showListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await showListPage.expectPage('1 / 2');

      await showListPage.last.click();
      await showListPage.expectRowCount(prefix, 1);
      await showListPage.expectPage('2 / 2');

      await showListPage.first.click();
      await showListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await showListPage.expectPage('1 / 2');
    } finally {
      await Promise.all(shows.map((show) => showApi.delete(show.uuid)));
    }
  });

});
