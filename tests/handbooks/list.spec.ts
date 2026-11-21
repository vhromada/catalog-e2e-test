import { type Game, gameApi } from '../../api/resources/GameApi';
import { handbookApi } from '../../api/resources/HandbookApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { HandbookFormPage } from '../../pages/handbooks/HandbookFormPage';
import { HandbookListPage } from '../../pages/handbooks/HandbookListPage';
import { gameRequest, INVALID_UUID, handbookRequest } from '../../utils/testData';

test.describe('handbook list (/games/:game/handbooks)', () => {

  let game: Game;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/handbooks`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the handbook from BE', async ({authedPage}) => {
    await handbookApi.create(game.uuid, handbookRequest({content: 'Handbook content'}));
    const handbookListPage = new HandbookListPage(authedPage);
    await handbookListPage.goto(game.uuid);

    await handbookListPage.expectOpen(game.uuid);
    await expect(handbookListPage.content).toHaveText('Handbook content');
    await expect(handbookListPage.editLink).toBeVisible();
    await expect(handbookListPage.removeLink).toBeVisible();
  });

  test('shows the formatted handbook', async ({authedPage}) => {
    await handbookApi.create(game.uuid, handbookRequest({
      content: '[h1]Title[/h1]\n[h2]Subtitle[/h2]\n[b]Bold[/b] [i]Italic[/i] [u]Underline[/u]\n'
        + '[color=#ff0000]Red[/color] [bg=#ffff00]Yellow[/bg]\n'
        + '[table]\n[tr][th]Head 1[/th][th]Head 2[/th][/tr]\n[tr][td]Cell 1[/td][td]Cell 2[/td][/tr]\n[/table]'
    }));
    const handbookListPage = new HandbookListPage(authedPage);
    await handbookListPage.goto(game.uuid);

    await expect(handbookListPage.content.locator('h3')).toHaveText('Title');
    await expect(handbookListPage.content.locator('h4')).toHaveText('Subtitle');
    await expect(handbookListPage.content.locator('strong')).toHaveText('Bold');
    await expect(handbookListPage.content.locator('em')).toHaveText('Italic');
    await expect(handbookListPage.content.locator('u')).toHaveText('Underline');
    await expect(handbookListPage.content.getByText('Red', {exact: true})).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(handbookListPage.content.getByText('Yellow', {exact: true})).toHaveCSS('background-color', 'rgb(255, 255, 0)');
    await expect(handbookListPage.content.locator('table tr th')).toHaveText(['Head 1', 'Head 2']);
    await expect(handbookListPage.content.locator('table tr td')).toHaveText(['Cell 1', 'Cell 2']);
    await expect(handbookListPage.content).not.toContainText('[');
  });

  test('shows HTML and unsupported or invalid tags as text', async ({authedPage}) => {
    await handbookApi.create(game.uuid, handbookRequest({
      content: '<script>alert(1)</script> <b>html</b> [unknown]tag[/unknown] [color=red;x]invalid[/color]'
    }));
    const handbookListPage = new HandbookListPage(authedPage);
    await handbookListPage.goto(game.uuid);

    await expect(handbookListPage.content).toHaveText(
      '<script>alert(1)</script> <b>html</b> [unknown]tag[/unknown] [color=red;x]invalid[/color]'
    );
    await expect(handbookListPage.content.locator('script, b, span')).toHaveCount(0);
  });

  test('closes unclosed tags and keeps line breaks', async ({authedPage}) => {
    await handbookApi.create(game.uuid, handbookRequest({content: '[b]Unclosed\nSecond line'}));
    const handbookListPage = new HandbookListPage(authedPage);
    await handbookListPage.goto(game.uuid);

    await expect(handbookListPage.content.locator('strong')).toHaveText('UnclosedSecond line');
    await expect(handbookListPage.content.locator('br')).toHaveCount(1);
  });

  test('shows no data and no operations for a game without handbook', async ({authedPage}) => {
    const handbookListPage = new HandbookListPage(authedPage);
    await handbookListPage.goto(game.uuid);

    await handbookListPage.expectOpen(game.uuid);
    await expect(handbookListPage.operations).toHaveCount(0);
    await expect(handbookListPage.content).toHaveCount(0);
  });

  test('shows main menu, game menu and handbook menu', async ({authedPage}) => {
    const handbookListPage = new HandbookListPage(authedPage);
    const gameListPage = new GameListPage(authedPage);
    await handbookListPage.goto(game.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
    await expect(handbookListPage.listNavigation).toBeVisible();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const handbook = await handbookApi.create(game.uuid, handbookRequest());
    const handbookListPage = new HandbookListPage(authedPage);
    await new HandbookFormPage(authedPage).gotoEdit(game.uuid, handbook.uuid);
    await handbookListPage.openList();

    await handbookListPage.expectOpen(game.uuid);
  });

  test('opens edit form with the handbook', async ({authedPage}) => {
    const handbook = await handbookApi.create(game.uuid, handbookRequest({content: 'Handbook content'}));
    const handbookListPage = new HandbookListPage(authedPage);
    await handbookListPage.goto(game.uuid);
    await handbookListPage.edit();

    await new HandbookFormPage(authedPage).expectEditOpen(game.uuid, handbook.uuid, 'Handbook content');
  });

  test('removes the handbook', async ({authedPage}) => {
    await handbookApi.create(game.uuid, handbookRequest());
    const handbookListPage = new HandbookListPage(authedPage);
    await handbookListPage.goto(game.uuid);
    await handbookListPage.remove();

    await new GameListPage(authedPage).expectOpen();
    expect((await gameApi.get(game.uuid)).handbook).toBe(false);
  });

});
