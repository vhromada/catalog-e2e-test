import { cheatApi } from '../../api/resources/CheatApi';
import { type Game, gameApi } from '../../api/resources/GameApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { CheatFormPage } from '../../pages/cheats/CheatFormPage';
import { CheatListPage } from '../../pages/cheats/CheatListPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { cheatRequest, gameRequest, INVALID_UUID } from '../../utils/testData';

test.describe('cheat list (/games/:game/cheats)', () => {

  let game: Game;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/cheats`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the cheat from BE', async ({authedPage}) => {
    await cheatApi.create(game.uuid, cheatRequest({
      gameSetting: 'Game setting',
      cheatSetting: 'Cheat setting',
      data: [{action: 'Action 1', description: 'Description 1'}, {action: 'Action 2', description: 'Description 2'}]
    }));
    const cheatListPage = new CheatListPage(authedPage);
    await cheatListPage.goto(game.uuid);

    await cheatListPage.expectOpen(game.uuid);
    await expect(cheatListPage.gameSetting).toHaveText('Game setting');
    await expect(cheatListPage.cheatSetting).toHaveText('Cheat setting');
    await expect(cheatListPage.actions).toHaveText(['Action 1', 'Action 2']);
    await expect(cheatListPage.descriptions).toHaveText(['Description 1', 'Description 2']);
    await expect(cheatListPage.editLink).toBeVisible();
    await expect(cheatListPage.removeLink).toBeVisible();
  });

  test('shows no data and no operations for a game without cheat', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    await cheatListPage.goto(game.uuid);

    await cheatListPage.expectOpen(game.uuid);
    await expect(cheatListPage.operations).toHaveCount(0);
    await expect(cheatListPage.actions).toHaveCount(0);
    await expect(cheatListPage.gameSetting).toHaveText('');
    await expect(cheatListPage.cheatSetting).toHaveText('');
  });

  test('shows main menu, game menu and cheat menu', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const gameListPage = new GameListPage(authedPage);
    await cheatListPage.goto(game.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
    await expect(cheatListPage.listNavigation).toBeVisible();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const cheat = await cheatApi.create(game.uuid, cheatRequest());
    const cheatListPage = new CheatListPage(authedPage);
    await new CheatFormPage(authedPage).gotoEdit(game.uuid, cheat.uuid);
    await cheatListPage.openList();

    await cheatListPage.expectOpen(game.uuid);
  });

  test('opens edit form with the cheat', async ({authedPage}) => {
    const cheat = await cheatApi.create(game.uuid, cheatRequest({gameSetting: 'Game setting', cheatSetting: 'Cheat setting'}));
    const cheatListPage = new CheatListPage(authedPage);
    await cheatListPage.goto(game.uuid);
    await cheatListPage.edit();

    await new CheatFormPage(authedPage).expectEditOpen(game.uuid, cheat.uuid, {
      gameSetting: 'Game setting',
      cheatSetting: 'Cheat setting',
      data: cheat.data
    });
  });

  test('removes the cheat', async ({authedPage}) => {
    await cheatApi.create(game.uuid, cheatRequest());
    const cheatListPage = new CheatListPage(authedPage);
    await cheatListPage.goto(game.uuid);
    await cheatListPage.remove();

    await new GameListPage(authedPage).expectOpen();
    expect((await gameApi.get(game.uuid)).cheat).toBe(false);
  });

});
