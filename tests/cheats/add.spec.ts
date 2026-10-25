import { cheatApi } from '../../api/resources/CheatApi';
import { type Game, gameApi } from '../../api/resources/GameApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { CheatFormPage } from '../../pages/cheats/CheatFormPage';
import { CheatListPage } from '../../pages/cheats/CheatListPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { gameRequest, INVALID_UUID } from '../../utils/testData';

test.describe('add cheats (/games/:game/cheats/add)', () => {

  let game: Game;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/cheats/add`);

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form with a single cheat', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);

    await cheatFormPage.expectAddOpen(game.uuid);
    await expect(cheatFormPage.gameSetting).toHaveValue('');
    await expect(cheatFormPage.cheatSetting).toHaveValue('');
    await expect(cheatFormPage.action(0)).toHaveValue('');
    await expect(cheatFormPage.description(0)).toHaveValue('');
    await expect(cheatFormPage.action(1)).toHaveCount(0);
    await expect(cheatFormPage.removeButton(0)).toHaveCount(0);
    await expect(cheatFormPage.addCheatButton).toBeVisible();
    await expect(cheatFormPage.cancelButton).toBeVisible();
  });

  test('adds a cheat and stores it in BE', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const cheatFormPage = new CheatFormPage(authedPage);
    const gameListPage = new GameListPage(authedPage);
    await gameListPage.goto();
    await gameListPage.search(game.name);
    await gameListPage.cheatsLink(game.name).click();
    await cheatFormPage.expectAddOpen(game.uuid);
    await cheatFormPage.create({
      gameSetting: 'Game setting',
      cheatSetting: 'Cheat setting',
      data: [{action: 'Action 1', description: 'Description 1'}, {action: 'Action 2', description: 'Description 2'}]
    });

    await cheatListPage.expectOpen(game.uuid);
    await expect(cheatListPage.actions).toHaveText(['Action 1', 'Action 2']);
    const cheat = await cheatApi.find(game.uuid);
    expect(cheat).toMatchObject({
      gameSetting: 'Game setting',
      cheatSetting: 'Cheat setting',
      data: [{action: 'Action 1', description: 'Description 1'}, {action: 'Action 2', description: 'Description 2'}]
    });
    expect((await gameApi.get(game.uuid)).cheat).toBe(true);
  });

  test('adds a cheat with only the required fields', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);
    await cheatFormPage.create({data: [{action: 'Action', description: 'Description'}]});

    await cheatListPage.expectOpen(game.uuid);
    const cheat = await cheatApi.find(game.uuid);
    expect(cheat.data).toEqual([{action: 'Action', description: 'Description'}]);
    expect(cheat.gameSetting).toBeFalsy();
    expect(cheat.cheatSetting).toBeFalsy();
  });

  test('adds a cheat with the maximum field values', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);
    await cheatFormPage.create({
      gameSetting: 'a'.repeat(200),
      cheatSetting: 'b'.repeat(200),
      data: [{action: 'c'.repeat(200), description: 'd'.repeat(200)}]
    });

    await cheatListPage.expectOpen(game.uuid);
    expect(await cheatApi.find(game.uuid)).toMatchObject({
      gameSetting: 'a'.repeat(200),
      cheatSetting: 'b'.repeat(200),
      data: [{action: 'c'.repeat(200), description: 'd'.repeat(200)}]
    });
  });

  test('adds and removes cheat entries', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);
    await cheatFormPage.addCheatButton.click();
    await cheatFormPage.addCheatButton.click();

    await expect(cheatFormPage.action(2)).toBeVisible();
    await expect(cheatFormPage.removeButton(0)).toHaveCount(0);
    await expect(cheatFormPage.removeButton(1)).toBeVisible();
    await expect(cheatFormPage.removeButton(2)).toBeVisible();

    await cheatFormPage.action(1).fill('Removed action');
    await cheatFormPage.removeButton(1).click();

    await expect(cheatFormPage.action(2)).toHaveCount(0);
    await expect(cheatFormPage.action(1)).toHaveValue('');
  });

  test('cancel returns to games without saving', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);
    await cheatFormPage.action(0).fill('Action');
    await cheatFormPage.cancel();

    await new GameListPage(authedPage).expectOpen();
    expect((await gameApi.get(game.uuid)).cheat).toBe(false);
  });

  test('shows main menu and game menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await new CheatFormPage(authedPage).gotoAdd(game.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
  });

  test('shows errors when the cheat is empty', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);
    await cheatFormPage.createButton.click();

    await cheatFormPage.expectError('Action is required');
    await cheatFormPage.expectError('Description is required');
    await cheatFormPage.expectAddOpen(game.uuid);
    expect((await gameApi.get(game.uuid)).cheat).toBe(false);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);
    await cheatFormPage.create({
      gameSetting: 'a'.repeat(201),
      cheatSetting: 'b'.repeat(201),
      data: [{action: 'c'.repeat(201), description: 'd'.repeat(201)}]
    });

    await cheatFormPage.expectError('Maximum length of setting for game is 200');
    await cheatFormPage.expectError('Maximum length of setting for cheats is 200');
    await cheatFormPage.expectError('Maximum length of action is 200');
    await cheatFormPage.expectError('Maximum length of description is 200');
    await cheatFormPage.expectAddOpen(game.uuid);
    expect((await gameApi.get(game.uuid)).cheat).toBe(false);
  });

  test('shows errors for every incomplete cheat entry', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);
    await cheatFormPage.action(0).fill('Action');
    await cheatFormPage.description(0).fill('Description');
    await cheatFormPage.addCheatButton.click();
    await cheatFormPage.createButton.click();

    await cheatFormPage.expectError('Action is required');
    await cheatFormPage.expectError('Description is required');
    await cheatFormPage.expectAddOpen(game.uuid);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoAdd(game.uuid);
    await cheatFormPage.createButton.click();
    await cheatFormPage.expectError('Action is required');
    await cheatFormPage.create({data: [{action: 'Action', description: 'Description'}]});

    await cheatFormPage.expectNoError('Action is required');
    await cheatFormPage.expectNoError('Description is required');
    await cheatListPage.expectOpen(game.uuid);
    expect((await gameApi.get(game.uuid)).cheat).toBe(true);
  });

});
