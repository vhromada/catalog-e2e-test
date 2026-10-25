import { cheatApi } from '../../api/resources/CheatApi';
import { gameApi } from '../../api/resources/GameApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameDetailPage } from '../../pages/games/GameDetailPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { cheatRequest, gameRequest, INVALID_UUID } from '../../utils/testData';

test.describe('game detail (/games/:uuid/detail)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the game from BE', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest({
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      mediaCount: 3,
      format: 'BINARY',
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
      const gameDetailPage = new GameDetailPage(authedPage);
      await gameDetailPage.goto(game.uuid);

      await gameDetailPage.expectOpen(game.uuid);
      await expect(gameDetailPage.value('Name')).toHaveText(game.name);
      await expect(gameDetailPage.value('Count of media')).toHaveText('3');
      await expect(gameDetailPage.value('Format')).toHaveText('Binary file');
      await expect(gameDetailPage.value('Additional data')).toHaveText('Crack, serial key, patch, trainer, data for trainer, editor, saves, Other data');
      await expect(gameDetailPage.value('Note')).toHaveText('Note');
      await expect(gameDetailPage.wikiCzLink).toHaveAttribute('href', 'https://cz.wikipedia.org/wiki/Wiki_CZ');
      await expect(gameDetailPage.wikiEnLink).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Wiki_EN');
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('hides the optional fields when they are not set', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameDetailPage = new GameDetailPage(authedPage);
      await gameDetailPage.goto(game.uuid);

      await expect(gameDetailPage.value('Name')).toHaveText(game.name);
      await expect(gameDetailPage.value('Format')).toHaveText('ISO');
      await expect(gameDetailPage.row('Additional data')).toHaveCount(0);
      await expect(gameDetailPage.row('Note')).toHaveCount(0);
      await expect(gameDetailPage.wikiCzLink).toHaveCount(0);
      await expect(gameDetailPage.wikiEnLink).toHaveCount(0);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('shows only crack as additional data', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest({crack: true}));
    try {
      const gameDetailPage = new GameDetailPage(authedPage);
      await gameDetailPage.goto(game.uuid);

      await expect(gameDetailPage.value('Additional data')).toHaveText('Crack');
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('shows only serial key as additional data', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest({serialKey: true}));
    try {
      const gameDetailPage = new GameDetailPage(authedPage);
      await gameDetailPage.goto(game.uuid);

      await expect(gameDetailPage.value('Additional data')).toHaveText('Serial key');
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  for (const [field, title] of [['patch', 'Patch'], ['trainer', 'Trainer'], ['trainerData', 'Data for trainer'], ['editor', 'Editor'], ['saves', 'Saves']]) {
    test(`shows only ${field} as additional data`, async ({authedPage}) => {
      const game = await gameApi.create(gameRequest({[field]: true}));
      try {
        const gameDetailPage = new GameDetailPage(authedPage);
        await gameDetailPage.goto(game.uuid);

        await expect(gameDetailPage.value('Additional data')).toHaveText(title);
      } finally {
        await gameApi.delete(game.uuid);
      }
    });
  }

  test('shows link to add cheats when the game has no cheats', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameDetailPage = new GameDetailPage(authedPage);
      await gameDetailPage.goto(game.uuid);
      await expect(gameDetailPage.cheatsLink).toHaveCount(0);
      await gameDetailPage.addCheatsLink.click();

      await expect(authedPage).toHaveURL(new RegExp(`/games/${game.uuid}/cheats/add$`));
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('shows link to cheats when the game has cheats', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      await cheatApi.create(game.uuid, cheatRequest());
      const gameDetailPage = new GameDetailPage(authedPage);
      await gameDetailPage.goto(game.uuid);
      await expect(gameDetailPage.addCheatsLink).toHaveCount(0);
      await gameDetailPage.cheatsLink.click();

      await expect(authedPage).toHaveURL(new RegExp(`/games/${game.uuid}/cheats$`));
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('shows main menu and game menu', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      await new GameDetailPage(authedPage).goto(game.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(gameListPage.listNavigation).toBeVisible();
      await expect(gameListPage.addNavigation).toBeVisible();
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

});
