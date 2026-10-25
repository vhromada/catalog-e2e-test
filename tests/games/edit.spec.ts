import { gameApi } from '../../api/resources/GameApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameFormPage } from '../../pages/games/GameFormPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { gameRequest, INVALID_UUID, uniqueName } from '../../utils/testData';

test.describe('edit game (/games/:uuid)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the game from BE', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest({
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      mediaCount: 4,
      format: 'BATTLE_NET',
      crack: true,
      serialKey: true,
      patch: true,
      trainer: true,
      trainerData: true,
      editor: true,
      saves: true,
      otherData: 'Other data',
      note: 'Note'
    }));
    try {
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoEdit(game.uuid);

      await gameFormPage.expectEditOpen(game.uuid, {
        name: game.name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 4,
        format: 'BATTLE_NET',
        crack: true,
        serialKey: true,
        patch: true,
        trainer: true,
        trainerData: true,
        editor: true,
        saves: true,
        otherData: 'Other data',
        note: 'Note'
      });
      await expect(gameFormPage.cancelButton).toBeVisible();
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('updates the game and stores it in BE', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest({note: 'Note'}));
    const newName = uniqueName('Game');
    try {
      const gameListPage = new GameListPage(authedPage);
      const gameFormPage = new GameFormPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);
      await gameListPage.edit(game.name);
      await gameFormPage.expectEditOpen(game.uuid, {name: game.name, mediaCount: 1, format: 'ISO', note: 'Note'});
      await gameFormPage.update({
        name: newName,
        wikiCz: 'New_CZ',
        wikiEn: 'New_EN',
        mediaCount: 2,
        format: 'STEAM',
        crack: true,
        serialKey: true,
        patch: true,
        trainer: true,
        trainerData: true,
        editor: true,
        saves: true,
        otherData: 'New other data',
        note: 'New note'
      });

      await gameListPage.expectOpen();
      await gameListPage.search(newName);
      await gameListPage.expectRowCount(newName, 1);
      expect(await gameApi.get(game.uuid)).toEqual({
        uuid: game.uuid,
        name: newName,
        wikiCz: 'New_CZ',
        wikiEn: 'New_EN',
        mediaCount: 2,
        format: 'STEAM',
        crack: true,
        serialKey: true,
        patch: true,
        trainer: true,
        trainerData: true,
        editor: true,
        saves: true,
        otherData: 'New other data',
        note: 'New note',
        cheat: false
      });
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('clears the optional fields', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest({
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      crack: true,
      patch: true,
      trainer: true,
      trainerData: true,
      editor: true,
      saves: true,
      otherData: 'Other data',
      note: 'Note'
    }));
    try {
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoEdit(game.uuid);
      await gameFormPage.expectEditOpen(game.uuid, {
        name: game.name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 1,
        format: 'ISO',
        crack: true,
        patch: true,
        trainer: true,
        trainerData: true,
        editor: true,
        saves: true,
        otherData: 'Other data',
        note: 'Note'
      });
      await gameFormPage.update({name: game.name, mediaCount: 1, format: 'ISO'});

      await new GameListPage(authedPage).expectOpen();
      const updated = await gameApi.get(game.uuid);
      expect(updated.crack).toBe(false);
      expect([updated.patch, updated.trainer, updated.trainerData, updated.editor, updated.saves]).toEqual([false, false, false, false, false]);
      expect(updated.wikiCz).toBeFalsy();
      expect(updated.wikiEn).toBeFalsy();
      expect(updated.otherData).toBeFalsy();
      expect(updated.note).toBeFalsy();
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('saving without changes keeps the game unchanged', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest({
      wikiCz: 'Wiki_CZ',
      mediaCount: 2,
      format: 'BINARY',
      serialKey: true,
      patch: true,
      trainer: true,
      trainerData: true,
      editor: true,
      saves: true,
      note: 'Note'
    }));
    try {
      const gameListPage = new GameListPage(authedPage);
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoEdit(game.uuid);
      await gameFormPage.expectEditOpen(game.uuid, {
        name: game.name,
        wikiCz: 'Wiki_CZ',
        mediaCount: 2,
        format: 'BINARY',
        serialKey: true,
        patch: true,
        trainer: true,
        trainerData: true,
        editor: true,
        saves: true,
        note: 'Note'
      });
      await gameFormPage.updateButton.click();

      await gameListPage.expectOpen();
      expect(await gameApi.get(game.uuid)).toEqual(game);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoEdit(game.uuid);
      await gameFormPage.expectEditOpen(game.uuid, {name: game.name, mediaCount: 1, format: 'ISO'});
      await gameFormPage.name.fill(uniqueName('Game'));
      await gameFormPage.cancel();

      await gameListPage.expectOpen();
      expect((await gameApi.get(game.uuid)).name).toBe(game.name);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('shows main menu and game menu', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      await new GameFormPage(authedPage).gotoEdit(game.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(gameListPage.listNavigation).toBeVisible();
      await expect(gameListPage.addNavigation).toBeVisible();
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoEdit(game.uuid);
      await gameFormPage.expectEditOpen(game.uuid, {name: game.name, mediaCount: 1, format: 'ISO'});
      await gameFormPage.update({name: '', mediaCount: '', format: 'ISO'});

      await gameFormPage.expectError('Name is required');
      await gameFormPage.expectError('Count of media is required');
      expect(await gameApi.get(game.uuid)).toEqual(game);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('shows errors when fields are invalid', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoEdit(game.uuid);
      await gameFormPage.expectEditOpen(game.uuid, {name: game.name, mediaCount: 1, format: 'ISO'});
      await gameFormPage.update({
        name: 'a'.repeat(201),
        wikiCz: 'b'.repeat(101),
        wikiEn: 'c'.repeat(101),
        mediaCount: 101,
        format: 'ISO',
        otherData: 'd'.repeat(101),
        note: 'e'.repeat(101)
      });

      await gameFormPage.expectError('Maximum length of name is 200');
      await gameFormPage.expectError('Maximum length of Czech Wikipedia is 100');
      await gameFormPage.expectError('Maximum length of English Wikipedia is 100');
      await gameFormPage.expectError('Maximum value of count of media is 100');
      await gameFormPage.expectError('Maximum length of other data is 100');
      await gameFormPage.expectError('Maximum length of note is 100');
      expect(await gameApi.get(game.uuid)).toEqual(game);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    const newName = uniqueName('Game');
    try {
      const gameListPage = new GameListPage(authedPage);
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoEdit(game.uuid);
      await gameFormPage.expectEditOpen(game.uuid, {name: game.name, mediaCount: 1, format: 'ISO'});
      await gameFormPage.update({name: '', mediaCount: 1, format: 'ISO'});
      await gameFormPage.expectError('Name is required');
      await gameFormPage.update({name: newName, mediaCount: 1, format: 'ISO'});

      await gameFormPage.expectNoError('Name is required');
      await gameListPage.expectOpen();
      expect((await gameApi.get(game.uuid)).name).toBe(newName);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

});
