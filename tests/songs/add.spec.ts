import { type Music, musicApi } from '../../api/resources/MusicApi';
import { songApi } from '../../api/resources/SongApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { SongFormPage } from '../../pages/songs/SongFormPage';
import { SongListPage } from '../../pages/songs/SongListPage';
import { INVALID_UUID, musicRequest, uniqueName } from '../../utils/testData';

test.describe('add song (/music/:music/songs/add)', () => {

  let music: Music;

  test.beforeEach(async () => {
    music = await musicApi.create(musicRequest());
  });

  test.afterEach(async () => {
    await musicApi.delete(music.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/music/${INVALID_UUID}/songs/add`);

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);

    await songFormPage.expectAddOpen(music.uuid);
    await expect(songFormPage.name).toHaveValue('');
    await expect(songFormPage.hours).toHaveValue('0');
    await expect(songFormPage.minutes).toHaveValue('0');
    await expect(songFormPage.seconds).toHaveValue('0');
    await expect(songFormPage.note).toHaveValue('');
    await expect(songFormPage.cancelButton).toBeVisible();
  });

  test('adds a song and stores it in BE', async ({authedPage}) => {
    const name = uniqueName('Song');
    const songListPage = new SongListPage(authedPage);
    const songFormPage = new SongFormPage(authedPage);
    await songListPage.goto(music.uuid);
    await songListPage.openAdd();
    await songFormPage.expectAddOpen(music.uuid);
    await songFormPage.create({name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});

    await songListPage.expectOpen(music.uuid);
    await songListPage.expectRowCount(name, 1);
    const songs = (await songApi.list(music.uuid)).data;
    expect(songs).toHaveLength(1);
    expect(songs[0]).toMatchObject({name, length: 3725, note: 'Note'});
    const updatedMusic = await musicApi.get(music.uuid);
    expect(updatedMusic).toMatchObject({songsCount: 1, length: 3725});
  });

  test('adds a song with only the required fields', async ({authedPage}) => {
    const name = uniqueName('Song');
    const songListPage = new SongListPage(authedPage);
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.create({name, seconds: 1});

    await songListPage.expectOpen(music.uuid);
    const songs = (await songApi.list(music.uuid)).data;
    expect(songs).toHaveLength(1);
    expect(songs[0]).toMatchObject({name, length: 1});
    expect(songs[0].note).toBeFalsy();
  });

  test('adds a song with the maximum field values', async ({authedPage}) => {
    const name = uniqueName('Song').padEnd(100, 'a');
    const songListPage = new SongListPage(authedPage);
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.create({name, hours: 23, minutes: 59, seconds: 59, note: 'b'.repeat(100)});

    await songListPage.expectOpen(music.uuid);
    const songs = (await songApi.list(music.uuid)).data;
    expect(songs).toHaveLength(1);
    expect(songs[0]).toMatchObject({name, length: 86399, note: 'b'.repeat(100)});
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.name.fill(uniqueName('Song'));
    await songFormPage.cancel();

    await new SongListPage(authedPage).expectOpen(music.uuid);
    expect((await songApi.list(music.uuid)).data).toHaveLength(0);
  });

  test('shows main menu, music menu and song menu', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);
    const songListPage = new SongListPage(authedPage);
    await new SongFormPage(authedPage).gotoAdd(music.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(musicListPage.listNavigation).toBeVisible();
    await expect(musicListPage.addNavigation).toBeVisible();
    await expect(songListPage.listNavigation).toBeVisible();
    await expect(songListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.createButton.click();

    await songFormPage.expectError('Name is required');
    await songFormPage.expectError('Length must be at least 1 second');
    await songFormPage.expectNoError('Note is required');
    await songFormPage.expectAddOpen(music.uuid);
    expect((await songApi.list(music.uuid)).data).toHaveLength(0);
  });

  test('shows errors when length fields are empty', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.create({name: uniqueName('Song'), hours: '', minutes: '', seconds: ''});

    await songFormPage.expectError('Hours is required');
    await songFormPage.expectError('Minutes is required');
    await songFormPage.expectError('Seconds is required');
    await songFormPage.expectAddOpen(music.uuid);
  });

  test('shows errors when length is out of range', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.create({name: uniqueName('Song'), hours: 24, minutes: 60, seconds: 60});

    await songFormPage.expectError('Maximum value of hours is 23');
    await songFormPage.expectError('Maximum value of minutes is 59');
    await songFormPage.expectError('Maximum value of seconds is 59');
    await songFormPage.expectAddOpen(music.uuid);
    expect((await songApi.list(music.uuid)).data).toHaveLength(0);
  });

  test('shows errors when length is negative', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.create({name: uniqueName('Song'), hours: -1, minutes: -1, seconds: -1});

    await songFormPage.expectError('Minimum value of hours is 0');
    await songFormPage.expectError('Minimum value of minutes is 0');
    await songFormPage.expectError('Minimum value of seconds is 0');
    await songFormPage.expectAddOpen(music.uuid);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.create({name: 'a'.repeat(101), seconds: 1, note: 'b'.repeat(101)});

    await songFormPage.expectError('Maximum length of name is 100');
    await songFormPage.expectError('Maximum length of note is 100');
    await songFormPage.expectAddOpen(music.uuid);
    expect((await songApi.list(music.uuid)).data).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const name = uniqueName('Song');
    const songFormPage = new SongFormPage(authedPage);
    await songFormPage.gotoAdd(music.uuid);
    await songFormPage.createButton.click();
    await songFormPage.expectError('Name is required');
    await songFormPage.expectError('Length must be at least 1 second');
    await songFormPage.create({name, minutes: 3});

    await songFormPage.expectNoError('Name is required');
    await songFormPage.expectNoError('Length must be at least 1 second');
    await new SongListPage(authedPage).expectOpen(music.uuid);
    expect((await songApi.list(music.uuid)).data).toHaveLength(1);
  });

});
