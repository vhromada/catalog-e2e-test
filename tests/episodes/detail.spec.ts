import { episodeApi } from '../../api/resources/EpisodeApi';
import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { type Season, seasonApi } from '../../api/resources/SeasonApi';
import { type Show, showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { EpisodeDetailPage } from '../../pages/episodes/EpisodeDetailPage';
import { EpisodeListPage } from '../../pages/episodes/EpisodeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { episodeRequest, genreRequest, INVALID_UUID, seasonRequest, showRequest } from '../../utils/testData';

test.describe('episode detail (/shows/:show/seasons/:season/episodes/:uuid/detail)', () => {

  let genre: Genre;
  let show: Show;
  let season: Season;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
    show = await showApi.create(showRequest([genre.uuid]));
    season = await seasonApi.create(show.uuid, seasonRequest());
  });

  test.afterEach(async () => {
    await showApi.delete(show.uuid);
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/episodes/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the episode from BE', async ({authedPage}) => {
    const episode = await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: 3, length: 3725, note: 'Note'}));
    const episodeDetailPage = new EpisodeDetailPage(authedPage);
    await episodeDetailPage.goto(show.uuid, season.uuid, episode.uuid);

    await episodeDetailPage.expectOpen(show.uuid, season.uuid, episode.uuid);
    await expect(episodeDetailPage.value('Number')).toHaveText('3');
    await expect(episodeDetailPage.value('Name')).toHaveText(episode.name);
    await expect(episodeDetailPage.value('Length')).toHaveText('1:02:05');
    await expect(episodeDetailPage.value('Note')).toHaveText('Note');
  });

  test('hides the note when it is not set', async ({authedPage}) => {
    const episode = await episodeApi.create(show.uuid, season.uuid, episodeRequest({length: 65}));
    const episodeDetailPage = new EpisodeDetailPage(authedPage);
    await episodeDetailPage.goto(show.uuid, season.uuid, episode.uuid);

    await expect(episodeDetailPage.value('Length')).toHaveText('0:01:05');
    await expect(episodeDetailPage.row('Note')).toHaveCount(0);
  });

  test('shows main menu, show menu, season menu and episode menu', async ({authedPage}) => {
    const episode = await episodeApi.create(show.uuid, season.uuid, episodeRequest());
    const showListPage = new ShowListPage(authedPage);
    const seasonListPage = new SeasonListPage(authedPage);
    const episodeListPage = new EpisodeListPage(authedPage);
    await new EpisodeDetailPage(authedPage).goto(show.uuid, season.uuid, episode.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
    await expect(seasonListPage.listNavigation).toBeVisible();
    await expect(seasonListPage.addNavigation).toBeVisible();
    await expect(episodeListPage.listNavigation).toBeVisible();
    await expect(episodeListPage.addNavigation).toBeVisible();
  });

});
