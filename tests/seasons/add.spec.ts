import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { seasonApi } from '../../api/resources/SeasonApi';
import { type Show, showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonFormPage } from '../../pages/seasons/SeasonFormPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { genreRequest, INVALID_UUID, showRequest } from '../../utils/testData';

const currentYear = new Date().getFullYear();

test.describe('add season (/shows/:show/seasons/add)', () => {

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
    await page.goto(`/shows/${INVALID_UUID}/seasons/add`);

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);

    await seasonFormPage.expectAddOpen(show.uuid);
    await expect(seasonFormPage.number).toHaveValue('1');
    await expect(seasonFormPage.startYear).toHaveValue(String(currentYear));
    await expect(seasonFormPage.endYear).toHaveValue(String(currentYear));
    await expect(seasonFormPage.language('EN')).toBeVisible();
    expect(await seasonFormPage.languages.evaluateAll((inputs: HTMLInputElement[]) => inputs.some((input) => input.checked))).toBe(false);
    await expect(seasonFormPage.subtitle('CZ')).not.toBeChecked();
    await expect(seasonFormPage.subtitle('EN')).not.toBeChecked();
    await expect(seasonFormPage.note).toHaveValue('');
    await expect(seasonFormPage.cancelButton).toBeVisible();
  });

  test('adds a season and stores it in BE', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonListPage.goto(show.uuid);
    await seasonListPage.openAdd();
    await seasonFormPage.expectAddOpen(show.uuid);
    await seasonFormPage.create({number: 2, startYear: 2000, endYear: 2001, language: 'CZ', subtitles: ['CZ', 'EN'], note: 'Note'});

    await seasonListPage.expectOpen(show.uuid);
    await seasonListPage.expectRowCount(2, 1);
    const seasons = (await seasonApi.list(show.uuid)).data;
    expect(seasons).toHaveLength(1);
    expect(seasons[0]).toMatchObject({number: 2, startYear: 2000, endYear: 2001, language: 'CZ', note: 'Note', episodesCount: 0, length: 0});
    expect([...seasons[0].subtitles].sort()).toEqual(['CZ', 'EN']);
    expect((await showApi.get(show.uuid)).seasonsCount).toBe(1);
  });

  test('adds a season with only the required fields', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);
    await seasonFormPage.create({number: 1, startYear: currentYear, endYear: currentYear, language: 'EN'});

    await seasonListPage.expectOpen(show.uuid);
    const seasons = (await seasonApi.list(show.uuid)).data;
    expect(seasons).toHaveLength(1);
    expect(seasons[0]).toMatchObject({number: 1, startYear: currentYear, endYear: currentYear, language: 'EN', subtitles: []});
    expect(seasons[0].note).toBeFalsy();
  });

  test('adds a season with the boundary values', async ({authedPage}) => {
    const seasonListPage = new SeasonListPage(authedPage);
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);
    await seasonFormPage.create({number: 500, startYear: 1930, endYear: currentYear, language: 'EN', note: 'a'.repeat(100)});

    await seasonListPage.expectOpen(show.uuid);
    const seasons = (await seasonApi.list(show.uuid)).data;
    expect(seasons).toHaveLength(1);
    expect(seasons[0]).toMatchObject({number: 500, startYear: 1930, endYear: currentYear, note: 'a'.repeat(100)});
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);
    await seasonFormPage.number.fill('5');
    await seasonFormPage.cancel();

    await new SeasonListPage(authedPage).expectOpen(show.uuid);
    expect((await seasonApi.list(show.uuid)).data).toHaveLength(0);
  });

  test('shows main menu, show menu and season menu', async ({authedPage}) => {
    const showListPage = new ShowListPage(authedPage);
    const seasonListPage = new SeasonListPage(authedPage);
    await new SeasonFormPage(authedPage).gotoAdd(show.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(showListPage.listNavigation).toBeVisible();
    await expect(showListPage.addNavigation).toBeVisible();
    await expect(seasonListPage.listNavigation).toBeVisible();
    await expect(seasonListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);
    await seasonFormPage.create({number: '', startYear: '', endYear: ''});

    await seasonFormPage.expectError('Number is required');
    await seasonFormPage.expectError('Starting year is required');
    await seasonFormPage.expectError('Ending year is required');
    await seasonFormPage.expectError('Language is required');
    await seasonFormPage.expectNoError('Note is required');
    await seasonFormPage.expectAddOpen(show.uuid);
    expect((await seasonApi.list(show.uuid)).data).toHaveLength(0);
  });

  test('shows errors when number and years are out of range', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);
    await seasonFormPage.create({number: 0, startYear: 1929, endYear: 1929, language: 'EN'});

    await seasonFormPage.expectError('Minimum value of number is 1');
    await seasonFormPage.expectError('Minimum value of starting year is 1930');
    await seasonFormPage.expectError('Minimum value of ending year is 1930');
    await seasonFormPage.expectAddOpen(show.uuid);

    await seasonFormPage.create({number: 501, startYear: currentYear + 1, endYear: currentYear + 1, language: 'EN'});

    await seasonFormPage.expectError('Maximum value of number is 500');
    await seasonFormPage.expectError(`Maximum value of starting year is ${currentYear}`);
    await seasonFormPage.expectError(`Maximum value of ending year is ${currentYear}`);
    await seasonFormPage.expectAddOpen(show.uuid);
    expect((await seasonApi.list(show.uuid)).data).toHaveLength(0);
  });

  test('shows error when starting year is greater than ending year', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);
    await seasonFormPage.create({number: 1, startYear: 2001, endYear: 2000, language: 'EN'});

    await seasonFormPage.expectError('Starting year must be lesser or equals to ending year');
    await seasonFormPage.expectAddOpen(show.uuid);
    expect((await seasonApi.list(show.uuid)).data).toHaveLength(0);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);
    await seasonFormPage.create({number: 1, startYear: currentYear, endYear: currentYear, language: 'EN', note: 'a'.repeat(101)});

    await seasonFormPage.expectError('Maximum length of note is 100');
    await seasonFormPage.expectAddOpen(show.uuid);
    expect((await seasonApi.list(show.uuid)).data).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const seasonFormPage = new SeasonFormPage(authedPage);
    await seasonFormPage.gotoAdd(show.uuid);
    await seasonFormPage.createButton.click();
    await seasonFormPage.expectError('Language is required');
    await seasonFormPage.create({number: 1, startYear: currentYear, endYear: currentYear, language: 'EN'});

    await seasonFormPage.expectNoError('Language is required');
    await new SeasonListPage(authedPage).expectOpen(show.uuid);
    expect((await seasonApi.list(show.uuid)).data).toHaveLength(1);
  });

});
