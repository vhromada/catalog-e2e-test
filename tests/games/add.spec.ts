import { gameApi } from '../../api/resources/GameApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameFormPage } from '../../pages/games/GameFormPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { uniqueName } from '../../utils/testData';

test.describe('add game (/games/add)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/games/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const gameFormPage = new GameFormPage(authedPage);
    await gameFormPage.gotoAdd();

    await gameFormPage.expectAddOpen();
    await expect(gameFormPage.name).toHaveValue('');
    await expect(gameFormPage.wikiCz).toHaveValue('');
    await expect(gameFormPage.wikiEn).toHaveValue('');
    await expect(gameFormPage.mediaCount).toHaveValue('1');
    await expect(gameFormPage.formats.first()).toBeVisible();
    expect(await gameFormPage.formats.evaluateAll((inputs: HTMLInputElement[]) => inputs.some((input) => input.checked))).toBe(false);
    await expect(gameFormPage.crack).not.toBeChecked();
    await expect(gameFormPage.serialKey).not.toBeChecked();
    await expect(gameFormPage.patch).not.toBeChecked();
    await expect(gameFormPage.trainer).not.toBeChecked();
    await expect(gameFormPage.trainerData).not.toBeChecked();
    await expect(gameFormPage.editor).not.toBeChecked();
    await expect(gameFormPage.saves).not.toBeChecked();
    await expect(gameFormPage.otherData).toHaveValue('');
    await expect(gameFormPage.note).toHaveValue('');
    await expect(gameFormPage.cancelButton).toBeVisible();
  });

  test('lists the formats from BE', async ({authedPage}) => {
    const gameFormPage = new GameFormPage(authedPage);
    await gameFormPage.gotoAdd();

    await expect(gameFormPage.formats).toHaveCount(4);
    for (const format of ['ISO', 'BINARY', 'STEAM', 'BATTLE_NET']) {
      await expect(gameFormPage.format(format)).toBeVisible();
    }
  });

  test('adds a game and stores it in BE', async ({authedPage}) => {
    const name = uniqueName('Game');
    try {
      const gameListPage = new GameListPage(authedPage);
      const gameFormPage = new GameFormPage(authedPage);
      await gameListPage.goto();
      await gameListPage.openAdd();
      await gameFormPage.expectAddOpen();
      await gameFormPage.create({
        name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 3,
        format: 'STEAM',
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

      await gameListPage.expectOpen();
      await gameListPage.search(name);
      await gameListPage.expectRowCount(name, 1);
      const games = await gameApi.search(name);
      expect(games).toHaveLength(1);
      expect(games[0]).toMatchObject({
        name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 3,
        format: 'STEAM',
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
    } finally {
      await gameApi.deleteByName(name);
    }
  });

  test('adds a game with only the required fields', async ({authedPage}) => {
    const name = uniqueName('Game');
    try {
      const gameListPage = new GameListPage(authedPage);
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoAdd();
      await gameFormPage.create({name, mediaCount: 1, format: 'ISO'});

      await gameListPage.expectOpen();
      const games = await gameApi.search(name);
      expect(games).toHaveLength(1);
      expect(games[0]).toMatchObject({name, mediaCount: 1, format: 'ISO', crack: false, serialKey: false, patch: false, trainer: false, trainerData: false, editor: false, saves: false});
      expect(games[0].wikiCz).toBeFalsy();
      expect(games[0].wikiEn).toBeFalsy();
      expect(games[0].otherData).toBeFalsy();
      expect(games[0].note).toBeFalsy();
    } finally {
      await gameApi.deleteByName(name);
    }
  });

  test('adds a game with the maximum field values', async ({authedPage}) => {
    const name = uniqueName('Game').padEnd(200, 'a');
    try {
      const gameListPage = new GameListPage(authedPage);
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoAdd();
      await gameFormPage.create({
        name,
        wikiCz: 'b'.repeat(100),
        wikiEn: 'c'.repeat(100),
        mediaCount: 100,
        format: 'ISO',
        otherData: 'd'.repeat(100),
        note: 'e'.repeat(100)
      });

      await gameListPage.expectOpen();
      const games = await gameApi.search(name);
      expect(games).toHaveLength(1);
      expect(games[0]).toMatchObject({
        name,
        wikiCz: 'b'.repeat(100),
        wikiEn: 'c'.repeat(100),
        mediaCount: 100,
        otherData: 'd'.repeat(100),
        note: 'e'.repeat(100)
      });
    } finally {
      await gameApi.deleteByName(name);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const name = uniqueName('Game');
    const gameListPage = new GameListPage(authedPage);
    const gameFormPage = new GameFormPage(authedPage);
    await gameFormPage.gotoAdd();
    await gameFormPage.name.fill(name);
    await gameFormPage.cancel();

    await gameListPage.expectOpen();
    expect(await gameApi.search(name)).toHaveLength(0);
  });

  test('shows main menu and game menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await new GameFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const gameFormPage = new GameFormPage(authedPage);
    await gameFormPage.gotoAdd();
    await expect(gameFormPage.formats.first()).toBeVisible();
    await gameFormPage.mediaCount.fill('');
    await gameFormPage.createButton.click();

    await gameFormPage.expectError('Name is required');
    await gameFormPage.expectError('Count of media is required');
    await gameFormPage.expectError('Format is required');
    await gameFormPage.expectNoError('Note is required');
    await gameFormPage.expectAddOpen();
  });

  test('shows errors when count of media is out of range', async ({authedPage}) => {
    const name = uniqueName('Game');
    const gameFormPage = new GameFormPage(authedPage);
    await gameFormPage.gotoAdd();
    await gameFormPage.create({name, mediaCount: 0, format: 'ISO'});

    await gameFormPage.expectError('Minimum value of count of media is 1');
    await gameFormPage.expectAddOpen();

    await gameFormPage.create({name, mediaCount: 101, format: 'ISO'});

    await gameFormPage.expectError('Maximum value of count of media is 100');
    await gameFormPage.expectAddOpen();
    expect(await gameApi.search(name)).toHaveLength(0);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const name = 'a'.repeat(201);
    const gameFormPage = new GameFormPage(authedPage);
    await gameFormPage.gotoAdd();
    await gameFormPage.create({
      name,
      wikiCz: 'b'.repeat(101),
      wikiEn: 'c'.repeat(101),
      mediaCount: 1,
      format: 'ISO',
      otherData: 'd'.repeat(101),
      note: 'e'.repeat(101)
    });

    await gameFormPage.expectError('Maximum length of name is 200');
    await gameFormPage.expectError('Maximum length of Czech Wikipedia is 100');
    await gameFormPage.expectError('Maximum length of English Wikipedia is 100');
    await gameFormPage.expectError('Maximum length of other data is 100');
    await gameFormPage.expectError('Maximum length of note is 100');
    await gameFormPage.expectAddOpen();
    expect(await gameApi.search(name)).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const name = uniqueName('Game');
    try {
      const gameListPage = new GameListPage(authedPage);
      const gameFormPage = new GameFormPage(authedPage);
      await gameFormPage.gotoAdd();
      await expect(gameFormPage.formats.first()).toBeVisible();
      await gameFormPage.createButton.click();
      await gameFormPage.expectError('Name is required');
      await gameFormPage.expectError('Format is required');
      await gameFormPage.create({name, mediaCount: 1, format: 'ISO'});

      await gameFormPage.expectNoError('Name is required');
      await gameFormPage.expectNoError('Format is required');
      await gameListPage.expectOpen();
      expect(await gameApi.search(name)).toHaveLength(1);
    } finally {
      await gameApi.deleteByName(name);
    }
  });

});
