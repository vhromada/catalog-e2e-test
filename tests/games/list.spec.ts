import { cheatApi } from '../../api/resources/CheatApi';
import { gameApi } from '../../api/resources/GameApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameDetailPage } from '../../pages/games/GameDetailPage';
import { GameFormPage } from '../../pages/games/GameFormPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { cheatRequest, gameRequest, ITEMS_PER_PAGE, pagesCount } from '../../utils/testData';

test.describe('game list (/games)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/games');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading, search form and statistics', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await gameListPage.goto();

    await gameListPage.expectOpen();
    await expect(gameListPage.searchName).toBeVisible();
    await expect(gameListPage.searchButton).toBeVisible();
    await expect(gameListPage.count).toHaveText(/\d+/);
    await expect(gameListPage.mediaCount).toHaveText(/\d+/);
  });

  // The DB is shared with tests running in parallel, so the BE data is compared only when it did not change while the FE was loading.
  test('shows counts of games and media from BE', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);

    await expect(async () => {
      const before = await gameApi.statistics();
      await gameListPage.goto();
      await expect(gameListPage.count).toHaveText(/\d+/);
      const shownCount = await gameListPage.count.innerText();
      const shownMediaCount = await gameListPage.mediaCount.innerText();
      const after = await gameApi.statistics();

      expect(after).toEqual(before);
      expect(shownCount).toBe(String(before.count));
      expect(shownMediaCount).toBe(String(before.mediaCount));
    }).toPass();
  });

  test('shows first page of games from BE', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);

      await expect(async () => {
        const before = await gameApi.list(1, ITEMS_PER_PAGE);
        const {count} = await gameApi.statistics();
        await gameListPage.goto();
        await expect(gameListPage.table).toBeVisible();
        const shown = await gameListPage.names.allInnerTexts();
        const pageInfo = await gameListPage.pageInfo.allInnerTexts();
        const after = await gameApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => item.name));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('shows games stored in BE', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);

      await gameListPage.expectRowCount(game.name, 1);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('searches games by name', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    const other = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);

      await gameListPage.expectRowCount(game.name, 1);
      await gameListPage.expectRowCount(other.name, 0);
    } finally {
      await gameApi.delete(game.uuid);
      await gameApi.delete(other.uuid);
    }
  });

  test('shows no table when search finds nothing', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await gameListPage.goto();
    await gameListPage.search(gameRequest().name);

    await expect(gameListPage.table).toHaveCount(0);
  });

  test('shows main menu and game menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await gameListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await gameListPage.goto();
    await gameListPage.openAdd();

    await new GameFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const gameFormPage = new GameFormPage(authedPage);
    const gameListPage = new GameListPage(authedPage);
    await gameFormPage.gotoAdd();
    await gameListPage.openList();

    await gameListPage.expectOpen();
  });

  test('opens detail of the game', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);
      await gameListPage.openDetail(game.name);

      await new GameDetailPage(authedPage).expectOpen(game.uuid);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('opens edit form with the game', async ({authedPage}) => {
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
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);
      await gameListPage.edit(game.name);

      await new GameFormPage(authedPage).expectEditOpen(game.uuid, {
        name: game.name,
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
      });
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('opens add cheats for a game without cheats', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);
      await expect(gameListPage.cheatsLink(game.name)).toHaveText('Add cheats');
      await gameListPage.cheatsLink(game.name).click();

      await expect(authedPage).toHaveURL(new RegExp(`/games/${game.uuid}/cheats/add$`));
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('opens cheats for a game with cheats', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      await cheatApi.create(game.uuid, cheatRequest());
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);
      await expect(gameListPage.cheatsLink(game.name)).toHaveText('Cheats');
      await gameListPage.cheatsLink(game.name).click();

      await expect(authedPage).toHaveURL(new RegExp(`/games/${game.uuid}/cheats$`));
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('duplicates a game', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest({mediaCount: 2, format: 'STEAM', crack: true, patch: true, saves: true, note: 'Note'}));
    try {
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);
      await gameListPage.duplicate(game.name);

      await gameListPage.expectRowCount(game.name, 2);
      const games = await gameApi.search(game.name);
      expect(games).toHaveLength(2);
      for (const item of games) {
        expect(item).toMatchObject({name: game.name, mediaCount: 2, format: 'STEAM', crack: true, serialKey: false, patch: true, trainer: false, saves: true, note: 'Note'});
      }
    } finally {
      await gameApi.deleteByName(game.name);
    }
  });

  test('removes a game', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);
      await gameListPage.remove(game.name);

      await gameListPage.expectRowCount(game.name, 0);
      expect(await gameApi.search(game.name)).toHaveLength(0);
    } finally {
      await gameApi.deleteByName(game.name);
    }
  });

  test('does not show paging for a single page of results', async ({authedPage}) => {
    const game = await gameApi.create(gameRequest());
    try {
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(game.name);

      await gameListPage.expectRowCount(game.name, 1);
      await expect(gameListPage.pageInfo).toHaveCount(0);
    } finally {
      await gameApi.delete(game.uuid);
    }
  });

  test('pages through search results', async ({authedPage}) => {
    const prefix = gameRequest().name;
    const games = await Promise.all(Array.from({length: ITEMS_PER_PAGE + 1}, (_, i) => gameApi.create(gameRequest({name: `${prefix} ${i}`}))));
    try {
      const gameListPage = new GameListPage(authedPage);
      await gameListPage.goto();
      await gameListPage.search(prefix);

      await gameListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await gameListPage.expectPage('1 / 2');
      await expect(gameListPage.first).toHaveCount(0);
      await expect(gameListPage.previous).toHaveCount(0);

      await gameListPage.next.click();
      await gameListPage.expectRowCount(prefix, 1);
      await gameListPage.expectPage('2 / 2');
      await expect(gameListPage.next).toHaveCount(0);
      await expect(gameListPage.last).toHaveCount(0);

      await gameListPage.previous.click();
      await gameListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await gameListPage.expectPage('1 / 2');

      await gameListPage.last.click();
      await gameListPage.expectRowCount(prefix, 1);
      await gameListPage.expectPage('2 / 2');

      await gameListPage.first.click();
      await gameListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await gameListPage.expectPage('1 / 2');
    } finally {
      await Promise.all(games.map((game) => gameApi.delete(game.uuid)));
    }
  });

});
