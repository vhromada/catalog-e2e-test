import { episodeApi } from '../../api/resources/EpisodeApi';
import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { seasonApi } from '../../api/resources/SeasonApi';
import { type Show, showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { EpisodeListPage } from '../../pages/episodes/EpisodeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonDetailPage } from '../../pages/seasons/SeasonDetailPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { episodeRequest, genreRequest, INVALID_UUID, seasonRequest, showRequest } from '../../utils/testData';

test.describe('season detail (/shows/:show/seasons/:uuid/detail)', () => {

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
    await page.goto(`/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the season from BE', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest({number: 2, startYear: 2000, endYear: 2002, language: 'CZ', subtitles: ['CZ', 'EN'], note: 'Note'}));
    const seasonDetailPage = new SeasonDetailPage(authedPage);
    await seasonDetailPage.goto(show.uuid, season.uuid);

    await seasonDetailPage.expectOpen(show.uuid, season.uuid);
    await expect(seasonDetailPage.value('Number')).toHaveText('2');
    await expect(seasonDetailPage.value('Years')).toHaveText('2000 - 2002');
    await expect(seasonDetailPage.value('Language')).toHaveText('Czech');
    await expect(seasonDetailPage.value('Subtitles')).toHaveText(/^(Czech, English|English, Czech)$/);
    await expect(seasonDetailPage.value('Count of episodes')).toHaveText('0');
    await expect(seasonDetailPage.value('Note')).toHaveText('Note');
  });

  test('shows a single year when starting and ending year are the same', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest({startYear: 2000, endYear: 2000}));
    const seasonDetailPage = new SeasonDetailPage(authedPage);
    await seasonDetailPage.goto(show.uuid, season.uuid);

    await expect(seasonDetailPage.value('Years')).toHaveText('2000');
  });

  test('hides the optional fields when they are not set', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest());
    const seasonDetailPage = new SeasonDetailPage(authedPage);
    await seasonDetailPage.goto(show.uuid, season.uuid);

    await expect(seasonDetailPage.value('Language')).toHaveText('English');
    await expect(seasonDetailPage.row('Subtitles')).toHaveCount(0);
    await expect(seasonDetailPage.row('Total length')).toHaveCount(0);
    await expect(seasonDetailPage.row('Note')).toHaveCount(0);
  });

  test('shows count and total length of episodes', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest());
    await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: 1, length: 65}));
    await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: 2, length: 3600}));
    const seasonDetailPage = new SeasonDetailPage(authedPage);
    await seasonDetailPage.goto(show.uuid, season.uuid);

    await expect(seasonDetailPage.value('Count of episodes')).toHaveText('2');
    await expect(seasonDetailPage.value('Total length')).toHaveText('1:01:05');
  });

  test('opens episodes of the season', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest());
    const seasonDetailPage = new SeasonDetailPage(authedPage);
    await seasonDetailPage.goto(show.uuid, season.uuid);
    await seasonDetailPage.episodesLink.click();

    await new EpisodeListPage(authedPage).expectOpen(show.uuid, season.uuid);
  });

  test('shows main menu, show menu and season menu', async ({authedPage}) => {
    const season = await seasonApi.create(show.uuid, seasonRequest());
    const showListPage = new ShowListPage(authedPage);
    const seasonListPage = new SeasonListPage(authedPage);
    await new SeasonDetailPage(authedPage).goto(show.uuid, season.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
    await expect(seasonListPage.listNavigation).toBeVisible();
    await expect(seasonListPage.addNavigation).toBeVisible();
  });

});
