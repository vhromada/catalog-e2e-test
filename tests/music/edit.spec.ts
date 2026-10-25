import { musicApi } from '../../api/resources/MusicApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MusicFormPage } from '../../pages/music/MusicFormPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { INVALID_UUID, musicRequest, uniqueName } from '../../utils/testData';

test.describe('edit music (/music/:uuid)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/music/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the music from BE', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest({wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', mediaCount: 4, note: 'Note'}));
    try {
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoEdit(music.uuid);

      await musicFormPage.expectEditOpen(music.uuid, {name: music.name, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', mediaCount: 4, note: 'Note'});
      await expect(musicFormPage.cancelButton).toBeVisible();
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('updates the music and stores it in BE', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest({note: 'Note'}));
    const newName = uniqueName('Music');
    try {
      const musicListPage = new MusicListPage(authedPage);
      const musicFormPage = new MusicFormPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);
      await musicListPage.edit(music.name);
      await musicFormPage.expectEditOpen(music.uuid, {name: music.name, mediaCount: 1, note: 'Note'});
      await musicFormPage.update({name: newName, wikiCz: 'New_CZ', wikiEn: 'New_EN', mediaCount: 2, note: 'New note'});

      await musicListPage.expectOpen();
      await musicListPage.search(newName);
      await musicListPage.expectRowCount(newName, 1);
      expect(await musicApi.get(music.uuid)).toEqual({...music, name: newName, wikiCz: 'New_CZ', wikiEn: 'New_EN', mediaCount: 2, note: 'New note'});
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('clears the optional fields', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest({wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', note: 'Note'}));
    try {
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoEdit(music.uuid);
      await musicFormPage.expectEditOpen(music.uuid, {name: music.name, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', mediaCount: 1, note: 'Note'});
      await musicFormPage.update({name: music.name, mediaCount: 1});

      await new MusicListPage(authedPage).expectOpen();
      const updated = await musicApi.get(music.uuid);
      expect(updated.wikiCz).toBeFalsy();
      expect(updated.wikiEn).toBeFalsy();
      expect(updated.note).toBeFalsy();
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('saving without changes keeps the music unchanged', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest({wikiCz: 'Wiki_CZ', mediaCount: 2, note: 'Note'}));
    try {
      const musicListPage = new MusicListPage(authedPage);
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoEdit(music.uuid);
      await musicFormPage.expectEditOpen(music.uuid, {name: music.name, wikiCz: 'Wiki_CZ', mediaCount: 2, note: 'Note'});
      await musicFormPage.updateButton.click();

      await musicListPage.expectOpen();
      expect(await musicApi.get(music.uuid)).toEqual(music);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoEdit(music.uuid);
      await musicFormPage.expectEditOpen(music.uuid, {name: music.name, mediaCount: 1});
      await musicFormPage.name.fill(uniqueName('Music'));
      await musicFormPage.cancel();

      await musicListPage.expectOpen();
      expect((await musicApi.get(music.uuid)).name).toBe(music.name);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('shows main menu and music menu', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      await new MusicFormPage(authedPage).gotoEdit(music.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(musicListPage.listNavigation).toBeVisible();
      await expect(musicListPage.addNavigation).toBeVisible();
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoEdit(music.uuid);
      await musicFormPage.expectEditOpen(music.uuid, {name: music.name, mediaCount: 1});
      await musicFormPage.update({name: '', mediaCount: ''});

      await musicFormPage.expectError('Name is required');
      await musicFormPage.expectError('Count of media is required');
      expect(await musicApi.get(music.uuid)).toEqual(music);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('shows errors when fields are invalid', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoEdit(music.uuid);
      await musicFormPage.expectEditOpen(music.uuid, {name: music.name, mediaCount: 1});
      await musicFormPage.update({name: 'a'.repeat(201), wikiCz: 'b'.repeat(101), wikiEn: 'c'.repeat(101), mediaCount: 101, note: 'd'.repeat(101)});

      await musicFormPage.expectError('Maximum length of name is 200');
      await musicFormPage.expectError('Maximum length of Czech Wikipedia is 100');
      await musicFormPage.expectError('Maximum length of English Wikipedia is 100');
      await musicFormPage.expectError('Maximum value of count of media is 100');
      await musicFormPage.expectError('Maximum length of note is 100');
      expect(await musicApi.get(music.uuid)).toEqual(music);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    const newName = uniqueName('Music');
    try {
      const musicListPage = new MusicListPage(authedPage);
      const musicFormPage = new MusicFormPage(authedPage);
      await musicFormPage.gotoEdit(music.uuid);
      await musicFormPage.expectEditOpen(music.uuid, {name: music.name, mediaCount: 1});
      await musicFormPage.update({name: '', mediaCount: 1});
      await musicFormPage.expectError('Name is required');
      await musicFormPage.update({name: newName, mediaCount: 1});

      await musicFormPage.expectNoError('Name is required');
      await musicListPage.expectOpen();
      expect((await musicApi.get(music.uuid)).name).toBe(newName);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

});
