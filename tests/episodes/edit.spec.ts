import { type Episode, episodeApi } from '../../api/resources/EpisodeApi';
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
import { episodeRequest, genreRequest, INVALID_UUID, seasonRequest, showRequest, uniqueName } from '../../utils/testData';

test.describe('edit episode (/shows/:show/seasons/:season/episodes/:uuid)', () => {

  let genre: Genre;
  let show: Show;
  let season: Season;
  let episode: Episode;

  function values(): { number: number; name: string; hours: number; minutes: number; seconds: number; note: string } {
    return {number: 3, name: episode.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'};
  }

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
    show = await showApi.create(showRequest([genre.uuid]));
    season = await seasonApi.create(show.uuid, seasonRequest());
    episode = await episodeApi.create(show.uuid, season.uuid, episodeRequest({number: 3, length: 3725, note: 'Note'}));
  });

  test.afterEach(async () => {
    await showApi.delete(show.uuid);
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/episodes/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the episode from BE', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoEdit(show.uuid, season.uuid, episode.uuid);

    await episodeFormPage.expectEditOpen(show.uuid, season.uuid, episode.uuid, values());
    await expect(episodeFormPage.cancelButton).toBeVisible();
  });

  test('updates the episode and stores it in BE', async ({authedPage}) => {
    const newName = uniqueName('Episode');
    const episodeListPage = new EpisodeListPage(authedPage);
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeListPage.goto(show.uuid, season.uuid);
    await episodeListPage.edit(episode.name);
    await episodeFormPage.expectEditOpen(show.uuid, season.uuid, episode.uuid, values());
    await episodeFormPage.update({number: 4, name: newName, hours: 0, minutes: 4, seconds: 30, note: 'New note'});

    await episodeListPage.expectOpen(show.uuid, season.uuid);
    await episodeListPage.expectRowCount(newName, 1);
    expect(await episodeApi.get(show.uuid, season.uuid, episode.uuid)).toMatchObject({uuid: episode.uuid, number: 4, name: newName, length: 270, note: 'New note'});
    expect((await seasonApi.get(show.uuid, season.uuid)).length).toBe(270);
  });

  test('clears the note', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoEdit(show.uuid, season.uuid, episode.uuid);
    await episodeFormPage.expectEditOpen(show.uuid, season.uuid, episode.uuid, values());
    await episodeFormPage.update({number: 3, name: episode.name, hours: 1, minutes: 2, seconds: 5});

    await new EpisodeListPage(authedPage).expectOpen(show.uuid, season.uuid);
    expect((await episodeApi.get(show.uuid, season.uuid, episode.uuid)).note).toBeFalsy();
  });

  test('saving without changes keeps the episode unchanged', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoEdit(show.uuid, season.uuid, episode.uuid);
    await episodeFormPage.expectEditOpen(show.uuid, season.uuid, episode.uuid, values());
    await episodeFormPage.updateButton.click();

    await new EpisodeListPage(authedPage).expectOpen(show.uuid, season.uuid);
    expect(await episodeApi.get(show.uuid, season.uuid, episode.uuid)).toEqual(episode);
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoEdit(show.uuid, season.uuid, episode.uuid);
    await episodeFormPage.expectEditOpen(show.uuid, season.uuid, episode.uuid, values());
    await episodeFormPage.name.fill(uniqueName('Episode'));
    await episodeFormPage.cancel();

    await new EpisodeListPage(authedPage).expectOpen(show.uuid, season.uuid);
    expect(await episodeApi.get(show.uuid, season.uuid, episode.uuid)).toEqual(episode);
  });

  test('shows main menu, show menu, season menu and episode menu', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    const seasonListPage = new SeasonListPage(authedPage);
    const episodeListPage = new EpisodeListPage(authedPage);
    await new EpisodeFormPage(authedPage).gotoEdit(show.uuid, season.uuid, episode.uuid);

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
    await episodeFormPage.gotoEdit(show.uuid, season.uuid, episode.uuid);
    await episodeFormPage.expectEditOpen(show.uuid, season.uuid, episode.uuid, values());
    await episodeFormPage.update({number: 3, name: ''});

    await episodeFormPage.expectError('Name is required');
    await episodeFormPage.expectError('Length must be at least 1 second');
    expect(await episodeApi.get(show.uuid, season.uuid, episode.uuid)).toEqual(episode);
  });

  test('shows errors when fields are invalid', async ({authedPage}) => {
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoEdit(show.uuid, season.uuid, episode.uuid);
    await episodeFormPage.expectEditOpen(show.uuid, season.uuid, episode.uuid, values());
    await episodeFormPage.update({number: 501, name: 'a'.repeat(101), hours: 24, minutes: 60, seconds: 60, note: 'b'.repeat(101)});

    await episodeFormPage.expectError('Maximum value of number is 500');
    await episodeFormPage.expectError('Maximum length of name is 100');
    await episodeFormPage.expectError('Maximum value of hours is 23');
    await episodeFormPage.expectError('Maximum value of minutes is 59');
    await episodeFormPage.expectError('Maximum value of seconds is 59');
    await episodeFormPage.expectError('Maximum length of note is 100');
    expect(await episodeApi.get(show.uuid, season.uuid, episode.uuid)).toEqual(episode);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const newName = uniqueName('Episode');
    const episodeFormPage = new EpisodeFormPage(authedPage);
    await episodeFormPage.gotoEdit(show.uuid, season.uuid, episode.uuid);
    await episodeFormPage.expectEditOpen(show.uuid, season.uuid, episode.uuid, values());
    await episodeFormPage.update({number: 3, name: '', hours: 1, minutes: 2, seconds: 5});
    await episodeFormPage.expectError('Name is required');
    await episodeFormPage.update({number: 3, name: newName, hours: 1, minutes: 2, seconds: 5});

    await episodeFormPage.expectNoError('Name is required');
    await new EpisodeListPage(authedPage).expectOpen(show.uuid, season.uuid);
    expect((await episodeApi.get(show.uuid, season.uuid, episode.uuid)).name).toBe(newName);
  });

});
