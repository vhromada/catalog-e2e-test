import { type Cheat, cheatApi } from '../../api/resources/CheatApi';
import { type Game, gameApi } from '../../api/resources/GameApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { CheatFormPage } from '../../pages/cheats/CheatFormPage';
import { CheatListPage } from '../../pages/cheats/CheatListPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { cheatRequest, gameRequest, INVALID_UUID } from '../../utils/testData';

test.describe('edit cheats (/games/:game/cheats/:uuid)', () => {

  let game: Game;
  let cheat: Cheat;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
    cheat = await cheatApi.create(game.uuid, cheatRequest({
      gameSetting: 'Game setting',
      cheatSetting: 'Cheat setting',
      data: [{action: 'Action 1', description: 'Description 1'}, {action: 'Action 2', description: 'Description 2'}]
    }));
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/cheats/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the cheat from BE', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoEdit(game.uuid, cheat.uuid);

    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {
      gameSetting: 'Game setting',
      cheatSetting: 'Cheat setting',
      data: cheat.data
    });
    await expect(cheatFormPage.removeButton(0)).toHaveCount(0);
    await expect(cheatFormPage.removeButton(1)).toBeVisible();
    await expect(cheatFormPage.cancelButton).toBeVisible();
  });

  test('updates the cheat and stores it in BE', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatListPage.goto(game.uuid);
    await cheatListPage.edit();
    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {gameSetting: 'Game setting', cheatSetting: 'Cheat setting', data: cheat.data});
    await cheatFormPage.update({
      gameSetting: 'New game setting',
      cheatSetting: 'New cheat setting',
      data: [
        {action: 'New action 1', description: 'New description 1'},
        {action: 'New action 2', description: 'New description 2'},
        {action: 'New action 3', description: 'New description 3'}
      ]
    });

    await cheatListPage.expectOpen(game.uuid);
    await expect(cheatListPage.actions).toHaveText(['New action 1', 'New action 2', 'New action 3']);
    expect(await cheatApi.get(game.uuid, cheat.uuid)).toEqual({
      uuid: cheat.uuid,
      gameSetting: 'New game setting',
      cheatSetting: 'New cheat setting',
      data: [
        {action: 'New action 1', description: 'New description 1'},
        {action: 'New action 2', description: 'New description 2'},
        {action: 'New action 3', description: 'New description 3'}
      ]
    });
  });

  test('removes a cheat entry', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoEdit(game.uuid, cheat.uuid);
    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {gameSetting: 'Game setting', cheatSetting: 'Cheat setting', data: cheat.data});
    await cheatFormPage.removeButton(1).click();
    await expect(cheatFormPage.action(1)).toHaveCount(0);
    await cheatFormPage.updateButton.click();

    await cheatListPage.expectOpen(game.uuid);
    expect((await cheatApi.get(game.uuid, cheat.uuid)).data).toEqual([{action: 'Action 1', description: 'Description 1'}]);
  });

  test('clears the optional settings', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoEdit(game.uuid, cheat.uuid);
    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {gameSetting: 'Game setting', cheatSetting: 'Cheat setting', data: cheat.data});
    await cheatFormPage.update({data: cheat.data});

    await cheatListPage.expectOpen(game.uuid);
    const updated = await cheatApi.get(game.uuid, cheat.uuid);
    expect(updated.gameSetting).toBeFalsy();
    expect(updated.cheatSetting).toBeFalsy();
    expect(updated.data).toEqual(cheat.data);
  });

  test('saving without changes keeps the cheat unchanged', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoEdit(game.uuid, cheat.uuid);
    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {gameSetting: 'Game setting', cheatSetting: 'Cheat setting', data: cheat.data});
    await cheatFormPage.updateButton.click();

    await new CheatListPage(authedPage).expectOpen(game.uuid);
    expect(await cheatApi.get(game.uuid, cheat.uuid)).toEqual(cheat);
  });

  test('cancel returns to cheats without saving', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoEdit(game.uuid, cheat.uuid);
    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {gameSetting: 'Game setting', cheatSetting: 'Cheat setting', data: cheat.data});
    await cheatFormPage.action(0).fill('Changed action');
    await cheatFormPage.cancel();

    await new CheatListPage(authedPage).expectOpen(game.uuid);
    expect(await cheatApi.get(game.uuid, cheat.uuid)).toEqual(cheat);
  });

  test('shows main menu, game menu and cheat menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await new CheatFormPage(authedPage).gotoEdit(game.uuid, cheat.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
    await expect(new CheatListPage(authedPage).listNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoEdit(game.uuid, cheat.uuid);
    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {gameSetting: 'Game setting', cheatSetting: 'Cheat setting', data: cheat.data});
    await cheatFormPage.update({data: [{action: '', description: ''}]});

    await cheatFormPage.expectError('Action is required');
    await cheatFormPage.expectError('Description is required');
    expect(await cheatApi.get(game.uuid, cheat.uuid)).toEqual(cheat);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoEdit(game.uuid, cheat.uuid);
    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {gameSetting: 'Game setting', cheatSetting: 'Cheat setting', data: cheat.data});
    await cheatFormPage.update({
      gameSetting: 'a'.repeat(201),
      cheatSetting: 'b'.repeat(201),
      data: [{action: 'c'.repeat(201), description: 'd'.repeat(201)}, cheat.data[1]]
    });

    await cheatFormPage.expectError('Maximum length of setting for game is 200');
    await cheatFormPage.expectError('Maximum length of setting for cheats is 200');
    await cheatFormPage.expectError('Maximum length of action is 200');
    await cheatFormPage.expectError('Maximum length of description is 200');
    expect(await cheatApi.get(game.uuid, cheat.uuid)).toEqual(cheat);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const cheatListPage = new CheatListPage(authedPage);
    const cheatFormPage = new CheatFormPage(authedPage);
    await cheatFormPage.gotoEdit(game.uuid, cheat.uuid);
    await cheatFormPage.expectEditOpen(game.uuid, cheat.uuid, {gameSetting: 'Game setting', cheatSetting: 'Cheat setting', data: cheat.data});
    await cheatFormPage.update({data: [{action: '', description: 'Description 1'}, cheat.data[1]]});
    await cheatFormPage.expectError('Action is required');
    await cheatFormPage.update({data: [{action: 'Fixed action', description: 'Description 1'}, cheat.data[1]]});

    await cheatFormPage.expectNoError('Action is required');
    await cheatListPage.expectOpen(game.uuid);
    expect((await cheatApi.get(game.uuid, cheat.uuid)).data[0].action).toBe('Fixed action');
  });

});
