import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { type Season, seasonApi } from '../../api/resources/SeasonApi';
import { type Show, showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonFormPage } from '../../pages/seasons/SeasonFormPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { genreRequest, INVALID_UUID, seasonRequest, showRequest } from '../../utils/testData';

const currentYear = new Date().getFullYear();
const values = {number: 2, startYear: 2000, endYear: 2001, language: 'CZ', subtitles: ['EN'], note: 'Note'};

test.describe('edit season (/shows/:show/seasons/:uuid)', () => {

  let genre: Genre;
  let show: Show;
  let season: Season;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
    show = await showApi.create(showRequest([genre.uuid]));
    season = await seasonApi.create(show.uuid, seasonRequest(values));
  });

  test.afterEach(async () => {
    await showApi.delete(show.uuid);
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/shows/${INVALID_UUID}/seasons/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the season from BE', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoEdit(show.uuid, season.uuid);

    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await expect(seasonFormPage.cancelButton).toBeVisible();
  });

  test('updates the season and stores it in BE', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonListPage.goto(show.uuid);
    await seasonListPage.edit(2);
    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await seasonFormPage.update({number: 3, startYear: 2010, endYear: 2012, language: 'EN', subtitles: ['CZ'], note: 'New note'});

    await seasonListPage.expectOpen(show.uuid);
    await seasonListPage.expectRowCount(3, 1);
    expect(await seasonApi.get(show.uuid, season.uuid)).toEqual({
      ...season,
      number: 3,
      startYear: 2010,
      endYear: 2012,
      language: 'EN',
      subtitles: ['CZ'],
      note: 'New note'
    });
  });

  test('clears the subtitles and the note', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoEdit(show.uuid, season.uuid);
    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await seasonFormPage.update({number: 2, startYear: 2000, endYear: 2001, language: 'CZ'});

    await new SeasonListPage(authedPage).expectOpen(show.uuid);
    const updated = await seasonApi.get(show.uuid, season.uuid);
    expect(updated.subtitles).toEqual([]);
    expect(updated.note).toBeFalsy();
  });

  test('saving without changes keeps the season unchanged', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoEdit(show.uuid, season.uuid);
    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await seasonFormPage.updateButton.click();

    await new SeasonListPage(authedPage).expectOpen(show.uuid);
    expect(await seasonApi.get(show.uuid, season.uuid)).toEqual(season);
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoEdit(show.uuid, season.uuid);
    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await seasonFormPage.number.fill('9');
    await seasonFormPage.cancel();

    await new SeasonListPage(authedPage).expectOpen(show.uuid);
    expect(await seasonApi.get(show.uuid, season.uuid)).toEqual(season);
  });

  test('shows main menu, show menu and season menu', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    const seasonListPage = new SeasonListPage(authedPage);
    await new SeasonFormPage(authedPage).gotoEdit(show.uuid, season.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
    await expect(seasonListPage.listNavigation).toBeVisible();
    await expect(seasonListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoEdit(show.uuid, season.uuid);
    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await seasonFormPage.update({number: '', startYear: '', endYear: '', language: 'CZ'});

    await seasonFormPage.expectError('Number is required');
    await seasonFormPage.expectError('Starting year is required');
    await seasonFormPage.expectError('Ending year is required');
    expect(await seasonApi.get(show.uuid, season.uuid)).toEqual(season);
  });

  test('shows errors when fields are invalid', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoEdit(show.uuid, season.uuid);
    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await seasonFormPage.update({number: 501, startYear: currentYear + 1, endYear: 1929, language: 'CZ', note: 'a'.repeat(101)});

    await seasonFormPage.expectError('Maximum value of number is 500');
    await seasonFormPage.expectError(`Maximum value of starting year is ${currentYear}`);
    await seasonFormPage.expectError('Minimum value of ending year is 1930');
    await seasonFormPage.expectError('Maximum length of note is 100');
    expect(await seasonApi.get(show.uuid, season.uuid)).toEqual(season);
  });

  test('shows error when starting year is greater than ending year', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoEdit(show.uuid, season.uuid);
    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await seasonFormPage.update({number: 2, startYear: 2002, endYear: 2001, language: 'CZ'});

    await seasonFormPage.expectError('Starting year must be lesser or equals to ending year');
    expect(await seasonApi.get(show.uuid, season.uuid)).toEqual(season);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoEdit(show.uuid, season.uuid);
    await seasonFormPage.expectEditOpen(show.uuid, season.uuid, values);
    await seasonFormPage.update({number: 2, startYear: 2002, endYear: 2001, language: 'CZ'});
    await seasonFormPage.expectError('Starting year must be lesser or equals to ending year');
    await seasonFormPage.update({number: 2, startYear: 2001, endYear: 2002, language: 'CZ'});

    await seasonFormPage.expectNoError('Starting year must be lesser or equals to ending year');
    await new SeasonListPage(authedPage).expectOpen(show.uuid);
    expect(await seasonApi.get(show.uuid, season.uuid)).toMatchObject({startYear: 2001, endYear: 2002});
  });

});
