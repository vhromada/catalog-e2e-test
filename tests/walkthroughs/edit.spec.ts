import { type Game, gameApi } from '../../api/resources/GameApi';
import { type Walkthrough, walkthroughApi } from '../../api/resources/WalkthroughApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { WalkthroughFormPage } from '../../pages/walkthroughs/WalkthroughFormPage';
import { WalkthroughListPage } from '../../pages/walkthroughs/WalkthroughListPage';
import { gameRequest, INVALID_UUID, walkthroughRequest } from '../../utils/testData';

const CONTENT = '[h1]Title[/h1]\n[b]Bold[/b] text\n[table]\n[tr][th]Head[/th][/tr]\n[tr][td]Cell[/td][/tr]\n[/table]';

test.describe('edit walkthrough (/games/:game/walkthroughs/:uuid)', () => {

  let game: Game;
  let walkthrough: Walkthrough;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
    walkthrough = await walkthroughApi.create(game.uuid, walkthroughRequest({content: CONTENT}));
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/walkthroughs/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the walkthrough from BE', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoEdit(game.uuid, walkthrough.uuid);

    await walkthroughFormPage.expectEditOpen(game.uuid, walkthrough.uuid, CONTENT);
    await expect(walkthroughFormPage.previewToggle).not.toBeChecked();
    await expect(walkthroughFormPage.preview).toHaveCount(0);
    await expect(walkthroughFormPage.cancelButton).toBeVisible();
  });

  test('shows the preview of the prefilled content', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoEdit(game.uuid, walkthrough.uuid);
    await walkthroughFormPage.expectEditOpen(game.uuid, walkthrough.uuid, CONTENT);
    await walkthroughFormPage.previewToggle.check();

    await expect(walkthroughFormPage.preview.locator('h3')).toHaveText('Title');
    await expect(walkthroughFormPage.preview.locator('strong')).toHaveText('Bold');
    await expect(walkthroughFormPage.preview.locator('table th')).toHaveText('Head');
    await expect(walkthroughFormPage.preview.locator('table td')).toHaveText('Cell');
  });

  test('updates the walkthrough and stores it in BE', async ({authedPage}) => {
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughListPage.goto(game.uuid);
    await walkthroughListPage.edit();
    await walkthroughFormPage.expectEditOpen(game.uuid, walkthrough.uuid, CONTENT);
    await walkthroughFormPage.update('[i]New[/i] content');

    await walkthroughListPage.expectOpen(game.uuid);
    await expect(walkthroughListPage.content).toHaveText('New content');
    await expect(walkthroughListPage.content.locator('em')).toHaveText('New');
    expect(await walkthroughApi.get(game.uuid, walkthrough.uuid)).toEqual({uuid: walkthrough.uuid, content: '[i]New[/i] content'});
  });

  test('formats the prefilled content', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoEdit(game.uuid, walkthrough.uuid);
    await walkthroughFormPage.expectEditOpen(game.uuid, walkthrough.uuid, CONTENT);
    const start = CONTENT.indexOf('text');
    await walkthroughFormPage.select(start, start + 'text'.length);
    await walkthroughFormPage.underline.click();
    await walkthroughFormPage.updateButton.click();

    await new WalkthroughListPage(authedPage).expectOpen(game.uuid);
    expect((await walkthroughApi.get(game.uuid, walkthrough.uuid)).content).toBe(CONTENT.replace('text', '[u]text[/u]'));
  });

  test('saving without changes keeps the walkthrough unchanged', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoEdit(game.uuid, walkthrough.uuid);
    await walkthroughFormPage.expectEditOpen(game.uuid, walkthrough.uuid, CONTENT);
    await walkthroughFormPage.updateButton.click();

    await new WalkthroughListPage(authedPage).expectOpen(game.uuid);
    expect(await walkthroughApi.get(game.uuid, walkthrough.uuid)).toEqual(walkthrough);
  });

  test('cancel returns to walkthroughs without saving', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoEdit(game.uuid, walkthrough.uuid);
    await walkthroughFormPage.expectEditOpen(game.uuid, walkthrough.uuid, CONTENT);
    await walkthroughFormPage.content.fill('Changed content');
    await walkthroughFormPage.cancel();

    await new WalkthroughListPage(authedPage).expectOpen(game.uuid);
    expect(await walkthroughApi.get(game.uuid, walkthrough.uuid)).toEqual(walkthrough);
  });

  test('shows main menu, game menu and walkthrough menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await new WalkthroughFormPage(authedPage).gotoEdit(game.uuid, walkthrough.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
    await expect(new WalkthroughListPage(authedPage).listNavigation).toBeVisible();
  });

  test('shows an error when the content is empty', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoEdit(game.uuid, walkthrough.uuid);
    await walkthroughFormPage.expectEditOpen(game.uuid, walkthrough.uuid, CONTENT);
    await walkthroughFormPage.update('');

    await walkthroughFormPage.expectError('Content is required');
    expect(await walkthroughApi.get(game.uuid, walkthrough.uuid)).toEqual(walkthrough);
  });

  test('clears the error after the content is corrected', async ({authedPage}) => {
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoEdit(game.uuid, walkthrough.uuid);
    await walkthroughFormPage.expectEditOpen(game.uuid, walkthrough.uuid, CONTENT);
    await walkthroughFormPage.update('');
    await walkthroughFormPage.expectError('Content is required');
    await walkthroughFormPage.update('Fixed content');

    await walkthroughFormPage.expectNoError('Content is required');
    await walkthroughListPage.expectOpen(game.uuid);
    expect((await walkthroughApi.get(game.uuid, walkthrough.uuid)).content).toBe('Fixed content');
  });

});
