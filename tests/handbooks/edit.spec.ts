import { type Game, gameApi } from '../../api/resources/GameApi';
import { type Handbook, handbookApi } from '../../api/resources/HandbookApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { HandbookFormPage } from '../../pages/handbooks/HandbookFormPage';
import { HandbookListPage } from '../../pages/handbooks/HandbookListPage';
import { gameRequest, INVALID_UUID, handbookRequest } from '../../utils/testData';

const CONTENT = '[h1]Title[/h1]\n[b]Bold[/b] text\n[table]\n[tr][th]Head[/th][/tr]\n[tr][td]Cell[/td][/tr]\n[/table]';

test.describe('edit handbook (/games/:game/handbooks/:uuid)', () => {

  let game: Game;
  let handbook: Handbook;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
    handbook = await handbookApi.create(game.uuid, handbookRequest({content: CONTENT}));
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/handbooks/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the handbook from BE', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoEdit(game.uuid, handbook.uuid);

    await handbookFormPage.expectEditOpen(game.uuid, handbook.uuid, CONTENT);
    await expect(handbookFormPage.previewToggle).not.toBeChecked();
    await expect(handbookFormPage.preview).toHaveCount(0);
    await expect(handbookFormPage.cancelButton).toBeVisible();
  });

  test('shows the preview of the prefilled content', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoEdit(game.uuid, handbook.uuid);
    await handbookFormPage.expectEditOpen(game.uuid, handbook.uuid, CONTENT);
    await handbookFormPage.previewToggle.check();

    await expect(handbookFormPage.preview.locator('h3')).toHaveText('Title');
    await expect(handbookFormPage.preview.locator('strong')).toHaveText('Bold');
    await expect(handbookFormPage.preview.locator('table th')).toHaveText('Head');
    await expect(handbookFormPage.preview.locator('table td')).toHaveText('Cell');
  });

  test('updates the handbook and stores it in BE', async ({authedPage}) => {
    const handbookListPage = new HandbookListPage(authedPage);
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookListPage.goto(game.uuid);
    await handbookListPage.edit();
    await handbookFormPage.expectEditOpen(game.uuid, handbook.uuid, CONTENT);
    await handbookFormPage.update('[i]New[/i] content');

    await handbookListPage.expectOpen(game.uuid);
    await expect(handbookListPage.content).toHaveText('New content');
    await expect(handbookListPage.content.locator('em')).toHaveText('New');
    expect(await handbookApi.get(game.uuid, handbook.uuid)).toEqual({uuid: handbook.uuid, content: '[i]New[/i] content'});
  });

  test('formats the prefilled content', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoEdit(game.uuid, handbook.uuid);
    await handbookFormPage.expectEditOpen(game.uuid, handbook.uuid, CONTENT);
    const start = CONTENT.indexOf('text');
    await handbookFormPage.select(start, start + 'text'.length);
    await handbookFormPage.underline.click();
    await handbookFormPage.updateButton.click();

    await new HandbookListPage(authedPage).expectOpen(game.uuid);
    expect((await handbookApi.get(game.uuid, handbook.uuid)).content).toBe(CONTENT.replace('text', '[u]text[/u]'));
  });

  test('saving without changes keeps the handbook unchanged', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoEdit(game.uuid, handbook.uuid);
    await handbookFormPage.expectEditOpen(game.uuid, handbook.uuid, CONTENT);
    await handbookFormPage.updateButton.click();

    await new HandbookListPage(authedPage).expectOpen(game.uuid);
    expect(await handbookApi.get(game.uuid, handbook.uuid)).toEqual(handbook);
  });

  test('cancel returns to handbooks without saving', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoEdit(game.uuid, handbook.uuid);
    await handbookFormPage.expectEditOpen(game.uuid, handbook.uuid, CONTENT);
    await handbookFormPage.content.fill('Changed content');
    await handbookFormPage.cancel();

    await new HandbookListPage(authedPage).expectOpen(game.uuid);
    expect(await handbookApi.get(game.uuid, handbook.uuid)).toEqual(handbook);
  });

  test('shows main menu, game menu and handbook menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await new HandbookFormPage(authedPage).gotoEdit(game.uuid, handbook.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
    await expect(new HandbookListPage(authedPage).listNavigation).toBeVisible();
  });

  test('shows an error when the content is empty', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoEdit(game.uuid, handbook.uuid);
    await handbookFormPage.expectEditOpen(game.uuid, handbook.uuid, CONTENT);
    await handbookFormPage.update('');

    await handbookFormPage.expectError('Content is required');
    expect(await handbookApi.get(game.uuid, handbook.uuid)).toEqual(handbook);
  });

  test('clears the error after the content is corrected', async ({authedPage}) => {
    const handbookListPage = new HandbookListPage(authedPage);
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoEdit(game.uuid, handbook.uuid);
    await handbookFormPage.expectEditOpen(game.uuid, handbook.uuid, CONTENT);
    await handbookFormPage.update('');
    await handbookFormPage.expectError('Content is required');
    await handbookFormPage.update('Fixed content');

    await handbookFormPage.expectNoError('Content is required');
    await handbookListPage.expectOpen(game.uuid);
    expect((await handbookApi.get(game.uuid, handbook.uuid)).content).toBe('Fixed content');
  });

});
