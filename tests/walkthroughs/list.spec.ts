import { type Game, gameApi } from '../../api/resources/GameApi';
import { walkthroughApi } from '../../api/resources/WalkthroughApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { WalkthroughFormPage } from '../../pages/walkthroughs/WalkthroughFormPage';
import { WalkthroughListPage } from '../../pages/walkthroughs/WalkthroughListPage';
import { gameRequest, INVALID_UUID, walkthroughRequest } from '../../utils/testData';

test.describe('walkthrough list (/games/:game/walkthroughs)', () => {

  let game: Game;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/walkthroughs`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the walkthrough from BE', async ({authedPage}) => {
    await walkthroughApi.create(game.uuid, walkthroughRequest({content: 'Walkthrough content'}));
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    await walkthroughListPage.goto(game.uuid);

    await walkthroughListPage.expectOpen(game.uuid);
    await expect(walkthroughListPage.content).toHaveText('Walkthrough content');
    await expect(walkthroughListPage.editLink).toBeVisible();
    await expect(walkthroughListPage.removeLink).toBeVisible();
  });

  test('shows the formatted walkthrough', async ({authedPage}) => {
    await walkthroughApi.create(game.uuid, walkthroughRequest({
      content: '[h1]Title[/h1]\n[h2]Subtitle[/h2]\n[b]Bold[/b] [i]Italic[/i] [u]Underline[/u]\n'
        + '[color=#ff0000]Red[/color] [bg=#ffff00]Yellow[/bg]\n'
        + '[table]\n[tr][th]Head 1[/th][th]Head 2[/th][/tr]\n[tr][td]Cell 1[/td][td]Cell 2[/td][/tr]\n[/table]'
    }));
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    await walkthroughListPage.goto(game.uuid);

    await expect(walkthroughListPage.content.locator('h3')).toHaveText('Title');
    await expect(walkthroughListPage.content.locator('h4')).toHaveText('Subtitle');
    await expect(walkthroughListPage.content.locator('strong')).toHaveText('Bold');
    await expect(walkthroughListPage.content.locator('em')).toHaveText('Italic');
    await expect(walkthroughListPage.content.locator('u')).toHaveText('Underline');
    await expect(walkthroughListPage.content.getByText('Red', {exact: true})).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(walkthroughListPage.content.getByText('Yellow', {exact: true})).toHaveCSS('background-color', 'rgb(255, 255, 0)');
    await expect(walkthroughListPage.content.locator('table tr th')).toHaveText(['Head 1', 'Head 2']);
    await expect(walkthroughListPage.content.locator('table tr td')).toHaveText(['Cell 1', 'Cell 2']);
    await expect(walkthroughListPage.content).not.toContainText('[');
  });

  test('shows HTML and unsupported or invalid tags as text', async ({authedPage}) => {
    await walkthroughApi.create(game.uuid, walkthroughRequest({
      content: '<script>alert(1)</script> <b>html</b> [unknown]tag[/unknown] [color=red;x]invalid[/color]'
    }));
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    await walkthroughListPage.goto(game.uuid);

    await expect(walkthroughListPage.content).toHaveText(
      '<script>alert(1)</script> <b>html</b> [unknown]tag[/unknown] [color=red;x]invalid[/color]'
    );
    await expect(walkthroughListPage.content.locator('script, b, span')).toHaveCount(0);
  });

  test('closes unclosed tags and keeps line breaks', async ({authedPage}) => {
    await walkthroughApi.create(game.uuid, walkthroughRequest({content: '[b]Unclosed\nSecond line'}));
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    await walkthroughListPage.goto(game.uuid);

    await expect(walkthroughListPage.content.locator('strong')).toHaveText('UnclosedSecond line');
    await expect(walkthroughListPage.content.locator('br')).toHaveCount(1);
  });

  test('shows no data and no operations for a game without walkthrough', async ({authedPage}) => {
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    await walkthroughListPage.goto(game.uuid);

    await walkthroughListPage.expectOpen(game.uuid);
    await expect(walkthroughListPage.operations).toHaveCount(0);
    await expect(walkthroughListPage.content).toHaveCount(0);
  });

  test('shows main menu, game menu and walkthrough menu', async ({authedPage}) => {
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    const gameListPage = new GameListPage(authedPage);
    await walkthroughListPage.goto(game.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
    await expect(walkthroughListPage.listNavigation).toBeVisible();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const walkthrough = await walkthroughApi.create(game.uuid, walkthroughRequest());
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    await new WalkthroughFormPage(authedPage).gotoEdit(game.uuid, walkthrough.uuid);
    await walkthroughListPage.openList();

    await walkthroughListPage.expectOpen(game.uuid);
  });

  test('opens edit form with the walkthrough', async ({authedPage}) => {
    const walkthrough = await walkthroughApi.create(game.uuid, walkthroughRequest({content: 'Walkthrough content'}));
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    await walkthroughListPage.goto(game.uuid);
    await walkthroughListPage.edit();

    await new WalkthroughFormPage(authedPage).expectEditOpen(game.uuid, walkthrough.uuid, 'Walkthrough content');
  });

  test('removes the walkthrough', async ({authedPage}) => {
    await walkthroughApi.create(game.uuid, walkthroughRequest());
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    await walkthroughListPage.goto(game.uuid);
    await walkthroughListPage.remove();

    await new GameListPage(authedPage).expectOpen();
    expect((await gameApi.get(game.uuid)).walkthrough).toBe(false);
  });

});
