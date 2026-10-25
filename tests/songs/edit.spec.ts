import { type Music, musicApi } from '../../api/resources/MusicApi';
import { type Song, songApi } from '../../api/resources/SongApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { SongFormPage } from '../../pages/songs/SongFormPage';
import { SongListPage } from '../../pages/songs/SongListPage';
import { INVALID_UUID, musicRequest, songRequest, uniqueName } from '../../utils/testData';

test.describe('edit song (/music/:music/songs/:uuid)', () => {

  let music: Music;
  let song: Song;

  test.beforeEach(async () => {
    music = await musicApi.create(musicRequest());
    song = await songApi.create(music.uuid, songRequest({length: 3725, note: 'Note'}));
  });

  test.afterEach(async () => {
    await musicApi.delete(music.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/music/${INVALID_UUID}/songs/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the song from BE', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoEdit(music.uuid, song.uuid);

    await songFormPage.expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
    await expect(songFormPage.cancelButton).toBeVisible();
  });

  test('updates the song and stores it in BE', async ({authedPage}) => {
    const newName = uniqueName('Song');
    const songListPage = new SongListPage(authedPage);
    const songFormPage = new SongFormPage(authedPage);
    await songListPage.goto(music.uuid);
    await songListPage.edit(song.name);
    await songFormPage.expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
    await songFormPage.update({name: newName, hours: 0, minutes: 4, seconds: 30, note: 'New note'});

    await songListPage.expectOpen(music.uuid);
    await songListPage.expectRowCount(newName, 1);
    expect(await songApi.get(music.uuid, song.uuid)).toMatchObject({uuid: song.uuid, name: newName, length: 270, note: 'New note'});
    expect((await musicApi.get(music.uuid)).length).toBe(270);
  });

  test('clears the note', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoEdit(music.uuid, song.uuid);
    await songFormPage.expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
    await songFormPage.update({name: song.name, hours: 1, minutes: 2, seconds: 5});

    await new SongListPage(authedPage).expectOpen(music.uuid);
    expect((await songApi.get(music.uuid, song.uuid)).note).toBeFalsy();
  });

  test('saving without changes keeps the song unchanged', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoEdit(music.uuid, song.uuid);
    await songFormPage.expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
    await songFormPage.updateButton.click();

    await new SongListPage(authedPage).expectOpen(music.uuid);
    expect(await songApi.get(music.uuid, song.uuid)).toEqual(song);
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoEdit(music.uuid, song.uuid);
    await songFormPage.expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
    await songFormPage.name.fill(uniqueName('Song'));
    await songFormPage.cancel();

    await new SongListPage(authedPage).expectOpen(music.uuid);
    expect(await songApi.get(music.uuid, song.uuid)).toEqual(song);
  });

  test('shows main menu, music menu and song menu', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);
    const songListPage = new SongListPage(authedPage);
    await new SongFormPage(authedPage).gotoEdit(music.uuid, song.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(musicListPage.listNavigation).toBeVisible();
    await expect(musicListPage.addNavigation).toBeVisible();
    await expect(songListPage.listNavigation).toBeVisible();
    await expect(songListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoEdit(music.uuid, song.uuid);
    await songFormPage.expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
    await songFormPage.update({name: ''});

    await songFormPage.expectError('Name is required');
    await songFormPage.expectError('Length must be at least 1 second');
    expect(await songApi.get(music.uuid, song.uuid)).toEqual(song);
  });

  test('shows errors when fields are invalid', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoEdit(music.uuid, song.uuid);
    await songFormPage.expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
    await songFormPage.update({name: 'a'.repeat(101), hours: 24, minutes: 60, seconds: 60, note: 'b'.repeat(101)});

    await songFormPage.expectError('Maximum length of name is 100');
    await songFormPage.expectError('Maximum value of hours is 23');
    await songFormPage.expectError('Maximum value of minutes is 59');
    await songFormPage.expectError('Maximum value of seconds is 59');
    await songFormPage.expectError('Maximum length of note is 100');
    expect(await songApi.get(music.uuid, song.uuid)).toEqual(song);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const newName = uniqueName('Song');
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoEdit(music.uuid, song.uuid);
    await songFormPage.expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
    await songFormPage.update({name: '', hours: 1, minutes: 2, seconds: 5});
    await songFormPage.expectError('Name is required');
    await songFormPage.update({name: newName, hours: 1, minutes: 2, seconds: 5});

    await songFormPage.expectNoError('Name is required');
    await new SongListPage(authedPage).expectOpen(music.uuid);
    expect((await songApi.get(music.uuid, song.uuid)).name).toBe(newName);
  });

});
