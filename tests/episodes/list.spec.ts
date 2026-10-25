import { episodeApi } from '../../api/resources/EpisodeApi';
import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { type Season, seasonApi } from '../../api/resources/SeasonApi';
import { type Show, showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { EpisodeDetailPage } from '../../pages/episodes/EpisodeDetailPage';
import { EpisodeFormPage } from '../../pages/episodes/EpisodeFormPage';
import { EpisodeListPage } from '../../pages/episodes/EpisodeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { episodeRequest, genreRequest, INVALID_UUID, ITEMS_PER_PAGE, seasonRequest, showRequest } from '../../utils/testData';

test.describe('episode list (/shows/:show/seasons/:season/episodes)', () => {

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
    await page.goto(`/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/episodes`);

    await new LoginPage(page).expectOpen();
  });

  test('shows heading', async ({authedPage}) => {
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);

    await episodeListPage.expectOpen(show.uuid, season.uuid);
  });

  test('shows episodes from BE', async ({authedPage}) => {
    const episodes = [
      await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: 1})),
      await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: 2}))
    ];
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);

    await expect(episodeListPage.names).toHaveText(episodes.map((episode) => episode.name));
    await expect(episodeListPage.pageInfo).toHaveCount(0);
    await expect(episodeListPage.noData).toHaveCount(0);
  });

  test('shows no table and no data message for season without episodes', async ({authedPage}) => {
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);

    await episodeListPage.expectOpen(show.uuid, season.uuid);
    await expect(episodeListPage.table).toHaveCount(0);
    await expect(episodeListPage.noData).toHaveText('No episodes');
  });

  test('shows main menu, show menu, season menu and episode menu', async ({authedPage}) => {
    const episodeListPage = new EpisodeListPage(authedPage);
    const seasonListPage = new SeasonListPage(authedPage);
    const showListPage = new ShowListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
    await expect(seasonListPage.listNavigation).toBeVisible();
    await expect(seasonListPage.addNavigation).toBeVisible();
    await expect(episodeListPage.listNavigation).toBeVisible();
    await expect(episodeListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);
    await episodeListPage.openAdd();

    await new EpisodeFormPage(authedPage).expectAddOpen(show.uuid, season.uuid);
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const episodeListPage = new EpisodeListPage(authedPage);
    await new EpisodeFormPage(authedPage).gotoAdd(show.uuid, season.uuid);
    await episodeListPage.openList();

    await episodeListPage.expectOpen(show.uuid, season.uuid);
  });

  test('opens detail of the episode', async ({authedPage}) => {
    const episode = await episodeApi.create(show.uuid, season.uuid, episodeRequest());
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);
    await episodeListPage.openDetail(episode.name);

    await new EpisodeDetailPage(authedPage).expectOpen(show.uuid, season.uuid, episode.uuid);
  });

  test('opens edit form with the episode', async ({authedPage}) => {
    const episode = await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: 3, length: 3725, note: 'Note'}));
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);
    await episodeListPage.edit(episode.name);

    await new EpisodeFormPage(authedPage).expectEditOpen(show.uuid, season.uuid, episode.uuid, {
      number: 3,
      name: episode.name,
      hours: 1,
      minutes: 2,
      seconds: 5,
      note: 'Note'
    });
  });

  test('duplicates an episode', async ({authedPage}) => {
    const episode = await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: 4, length: 125, note: 'Note'}));
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);
    await episodeListPage.duplicate(episode.name);

    await episodeListPage.expectRowCount(episode.name, 2);
    const episodes = (await episodeApi.list(show.uuid, season.uuid)).data;
    expect(episodes).toHaveLength(2);
    for (const item of episodes) {
      expect(item).toMatchObject({number: 4, name: episode.name, length: 125, note: 'Note'});
    }
    expect(await seasonApi.get(show.uuid, season.uuid)).toMatchObject({episodesCount: 2, length: 250});
  });

  test('removes an episode', async ({authedPage}) => {
    const episode = await episodeApi.create(show.uuid, season.uuid, episodeRequest());
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);
    await episodeListPage.remove(episode.name);

    await episodeListPage.expectRowCount(episode.name, 0);
    expect((await episodeApi.list(show.uuid, season.uuid)).data).toHaveLength(0);
  });

  test('pages through the episodes', async ({authedPage}) => {
    for (let i = 1; i <= ITEMS_PER_PAGE + 1; i++) {
      await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: i}));
    }
    const episodeListPage = new EpisodeListPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);

    await expect(episodeListPage.names).toHaveCount(ITEMS_PER_PAGE);
    await episodeListPage.expectPage('1 / 2');
    await expect(episodeListPage.first).toHaveCount(0);
    await expect(episodeListPage.previous).toHaveCount(0);

    await episodeListPage.next.click();
    await expect(episodeListPage.names).toHaveCount(1);
    await episodeListPage.expectPage('2 / 2');
    await expect(episodeListPage.next).toHaveCount(0);
    await expect(episodeListPage.last).toHaveCount(0);

    await episodeListPage.previous.click();
    await expect(episodeListPage.names).toHaveCount(ITEMS_PER_PAGE);
    await episodeListPage.expectPage('1 / 2');

    await episodeListPage.last.click();
    await expect(episodeListPage.names).toHaveCount(1);
    await episodeListPage.expectPage('2 / 2');

    await episodeListPage.first.click();
    await expect(episodeListPage.names).toHaveCount(ITEMS_PER_PAGE);
    await episodeListPage.expectPage('1 / 2');
  });

});
