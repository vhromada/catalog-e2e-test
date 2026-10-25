import { episodeApi } from '../../api/resources/EpisodeApi';
import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { seasonApi } from '../../api/resources/SeasonApi';
import { type Show, showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { EpisodeListPage } from '../../pages/episodes/EpisodeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonDetailPage } from '../../pages/seasons/SeasonDetailPage';
import { SeasonFormPage } from '../../pages/seasons/SeasonFormPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { episodeRequest, genreRequest, INVALID_UUID, ITEMS_PER_PAGE, seasonRequest, showRequest } from '../../utils/testData';

test.describe('season list (/shows/:show/seasons)', () => {

  let genre: Genre;
  let show: Show;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
    show = await showApi.create(showRequest([genre.uuid]));
  });

  test.afterEach(async () => {
    await showApi.delete(show.uuid);
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/shows/${INVALID_UUID}/seasons`);

    await new LoginPage(page).expectOpen();
  });

  test('shows heading', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);

    await seasonListPage.expectOpen(show.uuid);
  });

  test('shows seasons from BE', async ({authedPage}) => {
    await seasonApi.create(show.uuid, seasonRequest({number: 1}));
    await seasonApi.create(show.uuid, seasonRequest({number: 2}));
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);

    await expect(seasonListPage.numbers).toHaveText(['1', '2']);
    await expect(seasonListPage.pageInfo).toHaveCount(0);
    await expect(seasonListPage.noData).toHaveCount(0);
  });

  test('shows no table and no data message for show without seasons', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);

    await seasonListPage.expectOpen(show.uuid);
    await expect(seasonListPage.table).toHaveCount(0);
    await expect(seasonListPage.noData).toHaveText('No seasons');
  });

  test('shows main menu, show menu and season menu', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    const showListPage = new ShowListPage(authedPage);
    await seasonListPage.goto(show.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
    await expect(seasonListPage.listNavigation).toBeVisible();
    await expect(seasonListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);
    await seasonListPage.openAdd();

    await new SeasonFormPage(authedPage).expectAddOpen(show.uuid);
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    await new SeasonFormPage(authedPage).gotoAdd(show.uuid);
    await seasonListPage.openList();

    await seasonListPage.expectOpen(show.uuid);
  });

  test('opens detail of the season', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest({number: 3}));
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);
    await seasonListPage.openDetail(3);

    await new SeasonDetailPage(authedPage).expectOpen(show.uuid, season.uuid);
  });

  test('opens episodes of the season', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest());
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);
    await seasonListPage.openEpisodes(1);

    await new EpisodeListPage(authedPage).expectOpen(show.uuid, season.uuid);
  });

  test('opens edit form with the season', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest({number: 2, startYear: 2000, endYear: 2001, language: 'CZ', subtitles: ['EN'], note: 'Note'}));
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);
    await seasonListPage.edit(2);

    await new SeasonFormPage(authedPage).expectEditOpen(show.uuid, season.uuid, {number: 2, startYear: 2000, endYear: 2001, language: 'CZ', subtitles: ['EN'], note: 'Note'});
  });

  test('duplicates a season with its episodes', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest({number: 1, startYear: 2000, endYear: 2001, language: 'CZ', subtitles: ['EN'], note: 'Note'}));
    await episodeApi.create(show.uuid, season.uuid, episodeRequest({length: 90}));
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);
    await seasonListPage.duplicate(1);

    await seasonListPage.expectRowCount(1, 2);
    const seasons = (await seasonApi.list(show.uuid)).data;
    expect(seasons).toHaveLength(2);
    for (const item of seasons) {
      expect(item).toMatchObject({number: 1, startYear: 2000, endYear: 2001, language: 'CZ', subtitles: ['EN'], note: 'Note', episodesCount: 1, length: 90});
    }
    expect((await showApi.get(show.uuid)).seasonsCount).toBe(2);
  });

  test('removes a season', async ({authedPage}) => {
    await seasonApi.create(show.uuid, seasonRequest());
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);
    await seasonListPage.remove(1);

    await seasonListPage.expectRowCount(1, 0);
    expect((await seasonApi.list(show.uuid)).data).toHaveLength(0);
  });

  test('pages through the seasons', async ({authedPage}) => {
    for (let i = 1; i <= ITEMS_PER_PAGE + 1; i++) {
      await seasonApi.create(show.uuid, seasonRequest({number: i}));
    }
    const seasonListPage = new SeasonListPage(authedPage);
    await seasonListPage.goto(show.uuid);

    await expect(seasonListPage.numbers).toHaveCount(ITEMS_PER_PAGE);
    await seasonListPage.expectPage('1 / 2');
    await expect(seasonListPage.first).toHaveCount(0);
    await expect(seasonListPage.previous).toHaveCount(0);

    await seasonListPage.next.click();
    await expect(seasonListPage.numbers).toHaveCount(1);
    await seasonListPage.expectPage('2 / 2');
    await expect(seasonListPage.next).toHaveCount(0);
    await expect(seasonListPage.last).toHaveCount(0);

    await seasonListPage.previous.click();
    await expect(seasonListPage.numbers).toHaveCount(ITEMS_PER_PAGE);
    await seasonListPage.expectPage('1 / 2');

    await seasonListPage.last.click();
    await expect(seasonListPage.numbers).toHaveCount(1);
    await seasonListPage.expectPage('2 / 2');

    await seasonListPage.first.click();
    await expect(seasonListPage.numbers).toHaveCount(ITEMS_PER_PAGE);
    await seasonListPage.expectPage('1 / 2');
  });

});
