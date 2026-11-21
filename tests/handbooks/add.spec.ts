import { type Game, gameApi } from '../../api/resources/GameApi';
import { handbookApi } from '../../api/resources/HandbookApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { HandbookFormPage } from '../../pages/handbooks/HandbookFormPage';
import { HandbookListPage } from '../../pages/handbooks/HandbookListPage';
import { gameRequest, INVALID_UUID } from '../../utils/testData';

const TABLE = '[table]\n[tr][th]A[/th][th]B[/th][/tr]\n[tr][td]1[/td][td]2[/td][/tr]\n[/table]';

test.describe('add handbook (/games/:game/handbooks/add)', () => {

  let game: Game;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/handbooks/add`);

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form with the preview switched off', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);

    await handbookFormPage.expectAddOpen(game.uuid);
    await expect(handbookFormPage.content).toHaveValue('');
    await expect(handbookFormPage.previewToggle).not.toBeChecked();
    await expect(handbookFormPage.preview).toHaveCount(0);
    await expect(handbookFormPage.cancelButton).toBeVisible();
  });

  test('shows the formatting buttons and the table buttons only inside a table', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);

    for (const button of [handbookFormPage.bold, handbookFormPage.italic, handbookFormPage.underline, handbookFormPage.heading, handbookFormPage.subheading,
      handbookFormPage.colorInput, handbookFormPage.color, handbookFormPage.backgroundInput, handbookFormPage.background, handbookFormPage.table]) {
      await expect(button).toBeVisible();
    }
    for (const button of [handbookFormPage.tableHeader, handbookFormPage.tableRow, handbookFormPage.tableAddColumn, handbookFormPage.tableRemoveRow,
      handbookFormPage.tableRemoveColumn]) {
      await expect(button).toHaveCount(0);
    }

    await handbookFormPage.content.fill(TABLE);
    await handbookFormPage.select(TABLE.indexOf('A') + 1);
    for (const button of [handbookFormPage.tableHeader, handbookFormPage.tableRow, handbookFormPage.tableAddColumn, handbookFormPage.tableRemoveRow,
      handbookFormPage.tableRemoveColumn]) {
      await expect(button).toBeVisible();
    }

    await handbookFormPage.select(TABLE.length);
    await expect(handbookFormPage.tableRow).toHaveCount(0);
  });

  test('adds a handbook and stores it in BE', async ({authedPage}) => {
    const handbookListPage = new HandbookListPage(authedPage);
    const handbookFormPage = new HandbookFormPage(authedPage);
    const gameListPage = new GameListPage(authedPage);
    await gameListPage.goto();
    await gameListPage.search(game.name);
    await gameListPage.handbooksLink(game.name).click();
    await handbookFormPage.expectAddOpen(game.uuid);
    await handbookFormPage.create('[b]Handbook[/b] content');

    await handbookListPage.expectOpen(game.uuid);
    await expect(handbookListPage.content).toHaveText('Handbook content');
    await expect(handbookListPage.content.locator('strong')).toHaveText('Handbook');
    expect(await handbookApi.find(game.uuid)).toMatchObject({content: '[b]Handbook[/b] content'});
    expect((await gameApi.get(game.uuid)).handbook).toBe(true);
  });

  test('adds a handbook with multiple lines', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.create('Line 1\nLine 2\n\nLine 4');

    await new HandbookListPage(authedPage).expectOpen(game.uuid);
    expect((await handbookApi.find(game.uuid)).content).toBe('Line 1\nLine 2\n\nLine 4');
  });

  test('wraps the selected text in the formatting tags', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    const buttons = [
      {button: handbookFormPage.bold, expected: '[b]Text[/b]'},
      {button: handbookFormPage.italic, expected: '[i]Text[/i]'},
      {button: handbookFormPage.underline, expected: '[u]Text[/u]'},
      {button: handbookFormPage.heading, expected: '[h1]Text[/h1]'},
      {button: handbookFormPage.subheading, expected: '[h2]Text[/h2]'},
      {button: handbookFormPage.color, expected: '[color=#ff0000]Text[/color]'},
      {button: handbookFormPage.background, expected: '[bg=#ffff00]Text[/bg]'}
    ];

    for (const {button, expected} of buttons) {
      await handbookFormPage.content.fill('Text');
      await handbookFormPage.select(0, 4);
      await button.click();

      await expect(handbookFormPage.content).toHaveValue(expected);
    }
  });

  test('wraps only the selected part of the text', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.content.fill('Hello world');
    await handbookFormPage.select(6, 11);
    await handbookFormPage.bold.click();
    await handbookFormPage.select(0, 5);
    await handbookFormPage.italic.click();

    await expect(handbookFormPage.content).toHaveValue('[i]Hello[/i] [b]world[/b]');
  });

  test('uses the chosen colors', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.colorInput.fill('#00ff00');
    await handbookFormPage.backgroundInput.fill('#0000ff');
    await handbookFormPage.content.fill('Text');
    await handbookFormPage.select(0, 4);
    await handbookFormPage.color.click();
    await handbookFormPage.select(0, '[color=#00ff00]Text[/color]'.length);
    await handbookFormPage.background.click();

    await expect(handbookFormPage.content).toHaveValue('[bg=#0000ff][color=#00ff00]Text[/color][/bg]');
  });

  test('inserts a table', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.table.click();

    await expect(handbookFormPage.content).toHaveValue('[table]\n[tr][th][/th][/tr]\n[tr][td][/td][/tr]\n[/table]\n');
    await expect(handbookFormPage.tableRow).toBeVisible();
  });

  test('adds a header and a row to the table', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.content.fill(TABLE);
    await handbookFormPage.select(TABLE.indexOf('[/tr]') + '[/tr]'.length);
    await handbookFormPage.tableHeader.click();

    await expect(handbookFormPage.content).toHaveValue(
      '[table]\n[tr][th]A[/th][th]B[/th][/tr]\n[tr][th][/th][th][/th][/tr]\n[tr][td]1[/td][td]2[/td][/tr]\n[/table]'
    );

    await handbookFormPage.content.fill(TABLE);
    await handbookFormPage.select(TABLE.indexOf('[/tr]') + '[/tr]'.length);
    await handbookFormPage.tableRow.click();

    await expect(handbookFormPage.content).toHaveValue(
      '[table]\n[tr][th]A[/th][th]B[/th][/tr]\n[tr][td][/td][td][/td][/tr]\n[tr][td]1[/td][td]2[/td][/tr]\n[/table]'
    );
  });

  test('adds and removes a table column', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.content.fill(TABLE);
    await handbookFormPage.select(TABLE.indexOf('A') + 1);
    await handbookFormPage.tableAddColumn.click();

    await expect(handbookFormPage.content).toHaveValue(
      '[table]\n[tr][th]A[/th][th][/th][th]B[/th][/tr]\n[tr][td]1[/td][td][/td][td]2[/td][/tr]\n[/table]'
    );

    await handbookFormPage.content.fill(TABLE);
    await handbookFormPage.select(TABLE.indexOf('A') + 1);
    await handbookFormPage.tableRemoveColumn.click();

    await expect(handbookFormPage.content).toHaveValue('[table]\n[tr][th]B[/th][/tr]\n[tr][td]2[/td][/tr]\n[/table]');
  });

  test('removes a table row', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.content.fill(TABLE);
    await handbookFormPage.select(TABLE.indexOf('1') + 1);
    await handbookFormPage.tableRemoveRow.click();

    await expect(handbookFormPage.content).toHaveValue('[table]\n[tr][th]A[/th][th]B[/th][/tr]\n[/table]');
  });

  test('shows the preview of the formatted text', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.content.fill(`[h1]Title[/h1]\n[b]Bold[/b] [i]Italic[/i] [u]Underline[/u]\n${TABLE}`);
    await expect(handbookFormPage.preview).toHaveCount(0);
    await handbookFormPage.previewToggle.check();

    await expect(handbookFormPage.preview).toBeVisible();
    await expect(handbookFormPage.preview.locator('h3')).toHaveText('Title');
    await expect(handbookFormPage.preview.locator('strong')).toHaveText('Bold');
    await expect(handbookFormPage.preview.locator('em')).toHaveText('Italic');
    await expect(handbookFormPage.preview.locator('u')).toHaveText('Underline');
    await expect(handbookFormPage.preview.locator('table th')).toHaveText(['A', 'B']);
    await expect(handbookFormPage.preview.locator('table td')).toHaveText(['1', '2']);
  });

  test('updates the preview when the text changes and hides it when switched off', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.previewToggle.check();
    await handbookFormPage.content.fill('Plain');

    await expect(handbookFormPage.preview).toHaveText('Plain');
    await handbookFormPage.select(0, 5);
    await handbookFormPage.bold.click();
    await expect(handbookFormPage.preview.locator('strong')).toHaveText('Plain');

    await handbookFormPage.previewToggle.uncheck();

    await expect(handbookFormPage.preview).toHaveCount(0);
    await expect(handbookFormPage.content).toHaveValue('[b]Plain[/b]');
  });

  test('cancel returns to games without saving', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.content.fill('Content');
    await handbookFormPage.cancel();

    await new GameListPage(authedPage).expectOpen();
    expect((await gameApi.get(game.uuid)).handbook).toBe(false);
  });

  test('shows main menu and game menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await new HandbookFormPage(authedPage).gotoAdd(game.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
  });

  test('shows an error when the content is empty', async ({authedPage}) => {
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.createButton.click();

    await handbookFormPage.expectError('Content is required');
    await handbookFormPage.expectAddOpen(game.uuid);
    expect((await gameApi.get(game.uuid)).handbook).toBe(false);
  });

  test('clears the error after the content is filled', async ({authedPage}) => {
    const handbookListPage = new HandbookListPage(authedPage);
    const handbookFormPage = new HandbookFormPage(authedPage);
    await handbookFormPage.gotoAdd(game.uuid);
    await handbookFormPage.createButton.click();
    await handbookFormPage.expectError('Content is required');
    await handbookFormPage.create('Content');

    await handbookFormPage.expectNoError('Content is required');
    await handbookListPage.expectOpen(game.uuid);
    expect((await gameApi.get(game.uuid)).handbook).toBe(true);
  });

});
