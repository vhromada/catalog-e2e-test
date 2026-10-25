import { episodeApi } from '../../api/resources/EpisodeApi';
import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { type Season, seasonApi } from '../../api/resources/SeasonApi';
import { type Show, showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { EpisodeFormPage } from '../../pages/episodes/EpisodeFormPage';
import { EpisodeListPage } from '../../pages/episodes/EpisodeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { genreRequest, INVALID_UUID, seasonRequest, showRequest, uniqueName } from '../../utils/testData';

test.describe('add episode (/shows/:show/seasons/:season/episodes/add)', () => {

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
    await page.goto(`/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/episodes/add`);

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);

    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);
    await expect(episodeFormPage.number).toHaveValue('1');
    await expect(episodeFormPage.name).toHaveValue('');
    await expect(episodeFormPage.hours).toHaveValue('0');
    await expect(episodeFormPage.minutes).toHaveValue('0');
    await expect(episodeFormPage.seconds).toHaveValue('0');
    await expect(episodeFormPage.note).toHaveValue('');
    await expect(episodeFormPage.cancelButton).toBeVisible();
  });

  test('adds an episode and stores it in BE', async ({authedPage}) => {
    const name = uniqueName('Episode');
    const episodeListPage = new EpisodeListPage(authedPage);
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);
    await episodeListPage.openAdd();
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);
    await episodeFormPage.create({number: 3, name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});

    await episodeListPage.expectOpen(show.uuid, season.uuid);
    await episodeListPage.expectRowCount(name, 1);
    const episodes = (await episodeApi.list(show.uuid, season.uuid)).data;
    expect(episodes).toHaveLength(1);
    expect(episodes[0]).toMatchObject({number: 3, name, length: 3725, note: 'Note'});
    expect(await seasonApi.get(show.uuid, season.uuid)).toMatchObject({episodesCount: 1, length: 3725});
    expect(await showApi.get(show.uuid)).toMatchObject({episodesCount: 1, length: 3725});
  });

  test('adds an episode with only the required fields', async ({authedPage}) => {
    const name = uniqueName('Episode');
    const episodeListPage = new EpisodeListPage(authedPage);
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.create({name, seconds: 1});

    await episodeListPage.expectOpen(show.uuid, season.uuid);
    const episodes = (await episodeApi.list(show.uuid, season.uuid)).data;
    expect(episodes).toHaveLength(1);
    expect(episodes[0]).toMatchObject({number: 1, name, length: 1});
    expect(episodes[0].note).toBeFalsy();
  });

  test('adds an episode with the maximum field values', async ({authedPage}) => {
    const name = uniqueName('Episode').padEnd(100, 'a');
    const episodeListPage = new EpisodeListPage(authedPage);
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.create({number: 500, name, hours: 23, minutes: 59, seconds: 59, note: 'b'.repeat(100)});

    await episodeListPage.expectOpen(show.uuid, season.uuid);
    const episodes = (await episodeApi.list(show.uuid, season.uuid)).data;
    expect(episodes).toHaveLength(1);
    expect(episodes[0]).toMatchObject({number: 500, name, length: 86399, note: 'b'.repeat(100)});
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.name.fill(uniqueName('Episode'));
    await episodeFormPage.cancel();

    await new EpisodeListPage(authedPage).expectOpen(show.uuid, season.uuid);
    expect((await episodeApi.list(show.uuid, season.uuid)).data).toHaveLength(0);
  });

  test('shows main menu, show menu, season menu and episode menu', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    const seasonListPage = new SeasonListPage(authedPage);
    const episodeListPage = new EpisodeListPage(authedPage);
    await new EpisodeFormPage(authedPage).gotoAdd(show.uuid, season.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
    await expect(seasonListPage.listNavigation).toBeVisible();
    await expect(seasonListPage.addNavigation).toBeVisible();
    await expect(episodeListPage.listNavigation).toBeVisible();
    await expect(episodeListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.createButton.click();

    await episodeFormPage.expectError('Name is required');
    await episodeFormPage.expectError('Length must be at least 1 second');
    await episodeFormPage.expectNoError('Note is required');
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);
    expect((await episodeApi.list(show.uuid, season.uuid)).data).toHaveLength(0);
  });

  test('shows errors when number is out of range or empty', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.create({number: 0, name: uniqueName('Episode'), seconds: 1});

    await episodeFormPage.expectError('Minimum value of number is 1');
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);

    await episodeFormPage.create({number: 501, name: uniqueName('Episode'), seconds: 1});

    await episodeFormPage.expectError('Maximum value of number is 500');
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);

    await episodeFormPage.create({number: '', name: uniqueName('Episode'), seconds: 1});

    await episodeFormPage.expectError('Number is required');
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);
    expect((await episodeApi.list(show.uuid, season.uuid)).data).toHaveLength(0);
  });

  test('shows errors when length fields are empty', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.create({name: uniqueName('Episode'), hours: '', minutes: '', seconds: ''});

    await episodeFormPage.expectError('Hours is required');
    await episodeFormPage.expectError('Minutes is required');
    await episodeFormPage.expectError('Seconds is required');
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);
  });

  test('shows errors when length is out of range', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.create({name: uniqueName('Episode'), hours: 24, minutes: 60, seconds: 60});

    await episodeFormPage.expectError('Maximum value of hours is 23');
    await episodeFormPage.expectError('Maximum value of minutes is 59');
    await episodeFormPage.expectError('Maximum value of seconds is 59');
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);

    await episodeFormPage.create({name: uniqueName('Episode'), hours: -1, minutes: -1, seconds: -1});

    await episodeFormPage.expectError('Minimum value of hours is 0');
    await episodeFormPage.expectError('Minimum value of minutes is 0');
    await episodeFormPage.expectError('Minimum value of seconds is 0');
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);
    expect((await episodeApi.list(show.uuid, season.uuid)).data).toHaveLength(0);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.create({name: 'a'.repeat(101), seconds: 1, note: 'b'.repeat(101)});

    await episodeFormPage.expectError('Maximum length of name is 100');
    await episodeFormPage.expectError('Maximum length of note is 100');
    await episodeFormPage.expectAddOpen(show.uuid, season.uuid);
    expect((await episodeApi.list(show.uuid, season.uuid)).data).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const name = uniqueName('Episode');
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoAdd(show.uuid, season.uuid);
    await episodeFormPage.createButton.click();
    await episodeFormPage.expectError('Name is required');
    await episodeFormPage.expectError('Length must be at least 1 second');
    await episodeFormPage.create({name, minutes: 3});

    await episodeFormPage.expectNoError('Name is required');
    await episodeFormPage.expectNoError('Length must be at least 1 second');
    await new EpisodeListPage(authedPage).expectOpen(show.uuid, season.uuid);
    expect((await episodeApi.list(show.uuid, season.uuid)).data).toHaveLength(1);
  });

});
