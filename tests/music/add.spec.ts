import { musicApi } from '../../api/resources/MusicApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MusicFormPage } from '../../pages/music/MusicFormPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { uniqueName } from '../../utils/testData';

test.describe('add music (/music/add)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/music/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const musicFormPage = new MusicFormPage(authedPage);
    await musicFormPage.gotoAdd();

    await musicFormPage.expectAddOpen();
    await expect(musicFormPage.name).toHaveValue('');
    await expect(musicFormPage.wikiCz).toHaveValue('');
    await expect(musicFormPage.wikiEn).toHaveValue('');
    await expect(musicFormPage.mediaCount).toHaveValue('1');
    await expect(musicFormPage.note).toHaveValue('');
    await expect(musicFormPage.cancelButton).toBeVisible();
  });

  test('adds music and stores it in BE', async ({authedPage}) => {
    const name = uniqueName('Music');
    try {
      const musicListPage = new MusicListPage(authedPage);
      const musicFormPage = new MusicFormPage(authedPage);
      await musicListPage.goto();
      await musicListPage.openAdd();
      await musicFormPage.expectAddOpen();
      await musicFormPage.create({name, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', mediaCount: 3, note: 'Note'});

      await musicListPage.expectOpen();
      await musicListPage.search(name);
      await musicListPage.expectRowCount(name, 1);
      const musicList = await musicApi.search(name);
      expect(musicList).toHaveLength(1);
      expect(musicList[0]).toMatchObject({name, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', mediaCount: 3, note: 'Note', songsCount: 0, length: 0});
    } finally {
      await musicApi.deleteByName(name);
    }
  });

  test('adds music with only the required fields', async ({authedPage}) => {
    const name = uniqueName('Music');
    try {
      const musicListPage = new MusicListPage(authedPage);
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoAdd();
      await musicFormPage.create({name, mediaCount: 1});

      await musicListPage.expectOpen();
      const musicList = await musicApi.search(name);
      expect(musicList).toHaveLength(1);
      expect(musicList[0]).toMatchObject({name, mediaCount: 1});
      expect(musicList[0].wikiCz).toBeFalsy();
      expect(musicList[0].wikiEn).toBeFalsy();
      expect(musicList[0].note).toBeFalsy();
    } finally {
      await musicApi.deleteByName(name);
    }
  });

  test('adds music with the maximum field values', async ({authedPage}) => {
    const name = uniqueName('Music').padEnd(200, 'a');
    try {
      const musicListPage = new MusicListPage(authedPage);
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoAdd();
      await musicFormPage.create({name, wikiCz: 'b'.repeat(100), wikiEn: 'c'.repeat(100), mediaCount: 100, note: 'd'.repeat(100)});

      await musicListPage.expectOpen();
      const musicList = await musicApi.search(name);
      expect(musicList).toHaveLength(1);
      expect(musicList[0]).toMatchObject({name, wikiCz: 'b'.repeat(100), wikiEn: 'c'.repeat(100), mediaCount: 100, note: 'd'.repeat(100)});
    } finally {
      await musicApi.deleteByName(name);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const name = uniqueName('Music');
    const musicListPage = new MusicListPage(authedPage);
    const musicFormPage = new MusicFormPage(authedPage);
    await musicFormPage.gotoAdd();
    await musicFormPage.name.fill(name);
    await musicFormPage.cancel();

    await musicListPage.expectOpen();
    expect(await musicApi.search(name)).toHaveLength(0);
  });

  test('shows main menu and music menu', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);
    await new MusicFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(musicListPage.listNavigation).toBeVisible();
    await expect(musicListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const musicFormPage = new MusicFormPage(authedPage);
    await musicFormPage.gotoAdd();
    await musicFormPage.mediaCount.fill('');
    await musicFormPage.createButton.click();

    await musicFormPage.expectError('Name is required');
    await musicFormPage.expectError('Count of media is required');
    await musicFormPage.expectNoError('Note is required');
    await musicFormPage.expectAddOpen();
  });

  test('shows errors when count of media is out of range', async ({authedPage}) => {
    const name = uniqueName('Music');
    const musicFormPage = new MusicFormPage(authedPage);
    await musicFormPage.gotoAdd();
    await musicFormPage.create({name, mediaCount: 0});

    await musicFormPage.expectError('Minimum value of count of media is 1');
    await musicFormPage.expectAddOpen();

    await musicFormPage.create({name, mediaCount: 101});

    await musicFormPage.expectError('Maximum value of count of media is 100');
    await musicFormPage.expectAddOpen();
    expect(await musicApi.search(name)).toHaveLength(0);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const name = 'a'.repeat(201);
    const musicFormPage = new MusicFormPage(authedPage);
    await musicFormPage.gotoAdd();
    await musicFormPage.create({name, wikiCz: 'b'.repeat(101), wikiEn: 'c'.repeat(101), mediaCount: 1, note: 'd'.repeat(101)});

    await musicFormPage.expectError('Maximum length of name is 200');
    await musicFormPage.expectError('Maximum length of Czech Wikipedia is 100');
    await musicFormPage.expectError('Maximum length of English Wikipedia is 100');
    await musicFormPage.expectError('Maximum length of note is 100');
    await musicFormPage.expectAddOpen();
    expect(await musicApi.search(name)).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const name = uniqueName('Music');
    try {
      const musicListPage = new MusicListPage(authedPage);
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoAdd();
      await musicFormPage.createButton.click();
      await musicFormPage.expectError('Name is required');
      await musicFormPage.create({name, mediaCount: 1});

      await musicFormPage.expectNoError('Name is required');
      await musicListPage.expectOpen();
      expect(await musicApi.search(name)).toHaveLength(1);
    } finally {
      await musicApi.deleteByName(name);
    }
  });

});
