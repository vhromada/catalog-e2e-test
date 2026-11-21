import { type Game, gameApi } from '../../api/resources/GameApi';
import { walkthroughApi } from '../../api/resources/WalkthroughApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { LoginPage } from '../../pages/LoginPage';
import { WalkthroughFormPage } from '../../pages/walkthroughs/WalkthroughFormPage';
import { WalkthroughListPage } from '../../pages/walkthroughs/WalkthroughListPage';
import { gameRequest, INVALID_UUID } from '../../utils/testData';

const TABLE = '[table]\n[tr][th]A[/th][th]B[/th][/tr]\n[tr][td]1[/td][td]2[/td][/tr]\n[/table]';

test.describe('add walkthrough (/games/:game/walkthroughs/add)', () => {

  let game: Game;

  test.beforeEach(async () => {
    game = await gameApi.create(gameRequest());
  });

  test.afterEach(async () => {
    await gameApi.delete(game.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/games/${INVALID_UUID}/walkthroughs/add`);

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form with the preview switched off', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);

    await walkthroughFormPage.expectAddOpen(game.uuid);
    await expect(walkthroughFormPage.content).toHaveValue('');
    await expect(walkthroughFormPage.previewToggle).not.toBeChecked();
    await expect(walkthroughFormPage.preview).toHaveCount(0);
    await expect(walkthroughFormPage.cancelButton).toBeVisible();
  });

  test('shows the formatting buttons and the table buttons only inside a table', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);

    for (const button of [walkthroughFormPage.bold, walkthroughFormPage.italic, walkthroughFormPage.underline, walkthroughFormPage.heading, walkthroughFormPage.subheading,
      walkthroughFormPage.colorInput, walkthroughFormPage.color, walkthroughFormPage.backgroundInput, walkthroughFormPage.background, walkthroughFormPage.table]) {
      await expect(button).toBeVisible();
    }
    for (const button of [walkthroughFormPage.tableHeader, walkthroughFormPage.tableRow, walkthroughFormPage.tableAddColumn, walkthroughFormPage.tableRemoveRow,
      walkthroughFormPage.tableRemoveColumn]) {
      await expect(button).toHaveCount(0);
    }

    await walkthroughFormPage.content.fill(TABLE);
    await walkthroughFormPage.select(TABLE.indexOf('A') + 1);
    for (const button of [walkthroughFormPage.tableHeader, walkthroughFormPage.tableRow, walkthroughFormPage.tableAddColumn, walkthroughFormPage.tableRemoveRow,
      walkthroughFormPage.tableRemoveColumn]) {
      await expect(button).toBeVisible();
    }

    await walkthroughFormPage.select(TABLE.length);
    await expect(walkthroughFormPage.tableRow).toHaveCount(0);
  });

  test('adds a walkthrough and stores it in BE', async ({authedPage}) => {
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    const gameListPage = new GameListPage(authedPage);
    await gameListPage.goto();
    await gameListPage.search(game.name);
    await gameListPage.walkthroughsLink(game.name).click();
    await walkthroughFormPage.expectAddOpen(game.uuid);
    await walkthroughFormPage.create('[b]Walkthrough[/b] content');

    await walkthroughListPage.expectOpen(game.uuid);
    await expect(walkthroughListPage.content).toHaveText('Walkthrough content');
    await expect(walkthroughListPage.content.locator('strong')).toHaveText('Walkthrough');
    expect(await walkthroughApi.find(game.uuid)).toMatchObject({content: '[b]Walkthrough[/b] content'});
    expect((await gameApi.get(game.uuid)).walkthrough).toBe(true);
  });

  test('adds a walkthrough with multiple lines', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.create('Line 1\nLine 2\n\nLine 4');

    await new WalkthroughListPage(authedPage).expectOpen(game.uuid);
    expect((await walkthroughApi.find(game.uuid)).content).toBe('Line 1\nLine 2\n\nLine 4');
  });

  test('wraps the selected text in the formatting tags', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    const buttons = [
      {button: walkthroughFormPage.bold, expected: '[b]Text[/b]'},
      {button: walkthroughFormPage.italic, expected: '[i]Text[/i]'},
      {button: walkthroughFormPage.underline, expected: '[u]Text[/u]'},
      {button: walkthroughFormPage.heading, expected: '[h1]Text[/h1]'},
      {button: walkthroughFormPage.subheading, expected: '[h2]Text[/h2]'},
      {button: walkthroughFormPage.color, expected: '[color=#ff0000]Text[/color]'},
      {button: walkthroughFormPage.background, expected: '[bg=#ffff00]Text[/bg]'}
    ];

    for (const {button, expected} of buttons) {
      await walkthroughFormPage.content.fill('Text');
      await walkthroughFormPage.select(0, 4);
      await button.click();

      await expect(walkthroughFormPage.content).toHaveValue(expected);
    }
  });

  test('wraps only the selected part of the text', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.content.fill('Hello world');
    await walkthroughFormPage.select(6, 11);
    await walkthroughFormPage.bold.click();
    await walkthroughFormPage.select(0, 5);
    await walkthroughFormPage.italic.click();

    await expect(walkthroughFormPage.content).toHaveValue('[i]Hello[/i] [b]world[/b]');
  });

  test('uses the chosen colors', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.colorInput.fill('#00ff00');
    await walkthroughFormPage.backgroundInput.fill('#0000ff');
    await walkthroughFormPage.content.fill('Text');
    await walkthroughFormPage.select(0, 4);
    await walkthroughFormPage.color.click();
    await walkthroughFormPage.select(0, '[color=#00ff00]Text[/color]'.length);
    await walkthroughFormPage.background.click();

    await expect(walkthroughFormPage.content).toHaveValue('[bg=#0000ff][color=#00ff00]Text[/color][/bg]');
  });

  test('inserts a table', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.table.click();

    await expect(walkthroughFormPage.content).toHaveValue('[table]\n[tr][th][/th][/tr]\n[tr][td][/td][/tr]\n[/table]\n');
    await expect(walkthroughFormPage.tableRow).toBeVisible();
  });

  test('adds a header and a row to the table', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.content.fill(TABLE);
    await walkthroughFormPage.select(TABLE.indexOf('[/tr]') + '[/tr]'.length);
    await walkthroughFormPage.tableHeader.click();

    await expect(walkthroughFormPage.content).toHaveValue(
      '[table]\n[tr][th]A[/th][th]B[/th][/tr]\n[tr][th][/th][th][/th][/tr]\n[tr][td]1[/td][td]2[/td][/tr]\n[/table]'
    );

    await walkthroughFormPage.content.fill(TABLE);
    await walkthroughFormPage.select(TABLE.indexOf('[/tr]') + '[/tr]'.length);
    await walkthroughFormPage.tableRow.click();

    await expect(walkthroughFormPage.content).toHaveValue(
      '[table]\n[tr][th]A[/th][th]B[/th][/tr]\n[tr][td][/td][td][/td][/tr]\n[tr][td]1[/td][td]2[/td][/tr]\n[/table]'
    );
  });

  test('adds and removes a table column', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.content.fill(TABLE);
    await walkthroughFormPage.select(TABLE.indexOf('A') + 1);
    await walkthroughFormPage.tableAddColumn.click();

    await expect(walkthroughFormPage.content).toHaveValue(
      '[table]\n[tr][th]A[/th][th][/th][th]B[/th][/tr]\n[tr][td]1[/td][td][/td][td]2[/td][/tr]\n[/table]'
    );

    await walkthroughFormPage.content.fill(TABLE);
    await walkthroughFormPage.select(TABLE.indexOf('A') + 1);
    await walkthroughFormPage.tableRemoveColumn.click();

    await expect(walkthroughFormPage.content).toHaveValue('[table]\n[tr][th]B[/th][/tr]\n[tr][td]2[/td][/tr]\n[/table]');
  });

  test('removes a table row', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.content.fill(TABLE);
    await walkthroughFormPage.select(TABLE.indexOf('1') + 1);
    await walkthroughFormPage.tableRemoveRow.click();

    await expect(walkthroughFormPage.content).toHaveValue('[table]\n[tr][th]A[/th][th]B[/th][/tr]\n[/table]');
  });

  test('shows the preview of the formatted text', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.content.fill(`[h1]Title[/h1]\n[b]Bold[/b] [i]Italic[/i] [u]Underline[/u]\n${TABLE}`);
    await expect(walkthroughFormPage.preview).toHaveCount(0);
    await walkthroughFormPage.previewToggle.check();

    await expect(walkthroughFormPage.preview).toBeVisible();
    await expect(walkthroughFormPage.preview.locator('h3')).toHaveText('Title');
    await expect(walkthroughFormPage.preview.locator('strong')).toHaveText('Bold');
    await expect(walkthroughFormPage.preview.locator('em')).toHaveText('Italic');
    await expect(walkthroughFormPage.preview.locator('u')).toHaveText('Underline');
    await expect(walkthroughFormPage.preview.locator('table th')).toHaveText(['A', 'B']);
    await expect(walkthroughFormPage.preview.locator('table td')).toHaveText(['1', '2']);
  });

  test('updates the preview when the text changes and hides it when switched off', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.previewToggle.check();
    await walkthroughFormPage.content.fill('Plain');

    await expect(walkthroughFormPage.preview).toHaveText('Plain');
    await walkthroughFormPage.select(0, 5);
    await walkthroughFormPage.bold.click();
    await expect(walkthroughFormPage.preview.locator('strong')).toHaveText('Plain');

    await walkthroughFormPage.previewToggle.uncheck();

    await expect(walkthroughFormPage.preview).toHaveCount(0);
    await expect(walkthroughFormPage.content).toHaveValue('[b]Plain[/b]');
  });

  test('cancel returns to games without saving', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.content.fill('Content');
    await walkthroughFormPage.cancel();

    await new GameListPage(authedPage).expectOpen();
    expect((await gameApi.get(game.uuid)).walkthrough).toBe(false);
  });

  test('shows main menu and game menu', async ({authedPage}) => {
    const gameListPage = new GameListPage(authedPage);
    await new WalkthroughFormPage(authedPage).gotoAdd(game.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(gameListPage.listNavigation).toBeVisible();
    await expect(gameListPage.addNavigation).toBeVisible();
  });

  test('shows an error when the content is empty', async ({authedPage}) => {
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.createButton.click();

    await walkthroughFormPage.expectError('Content is required');
    await walkthroughFormPage.expectAddOpen(game.uuid);
    expect((await gameApi.get(game.uuid)).walkthrough).toBe(false);
  });

  test('clears the error after the content is filled', async ({authedPage}) => {
    const walkthroughListPage = new WalkthroughListPage(authedPage);
    const walkthroughFormPage = new WalkthroughFormPage(authedPage);
    await walkthroughFormPage.gotoAdd(game.uuid);
    await walkthroughFormPage.createButton.click();
    await walkthroughFormPage.expectError('Content is required');
    await walkthroughFormPage.create('Content');

    await walkthroughFormPage.expectNoError('Content is required');
    await walkthroughListPage.expectOpen(game.uuid);
    expect((await gameApi.get(game.uuid)).walkthrough).toBe(true);
  });

});
