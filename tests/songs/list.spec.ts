import { type Music, musicApi } from '../../api/resources/MusicApi';
import { songApi } from '../../api/resources/SongApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { SongDetailPage } from '../../pages/songs/SongDetailPage';
import { SongFormPage } from '../../pages/songs/SongFormPage';
import { SongListPage } from '../../pages/songs/SongListPage';
import { INVALID_UUID, ITEMS_PER_PAGE, musicRequest, songRequest } from '../../utils/testData';

test.describe('song list (/music/:music/songs)', () => {

  let music: Music;

  test.beforeEach(async () => {
    music = await musicApi.create(musicRequest());
  });

  test.afterEach(async () => {
    await musicApi.delete(music.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/music/${INVALID_UUID}/songs`);

    await new LoginPage(page).expectOpen();
  });

  test('shows heading', async ({authedPage}) => {
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);

    await songListPage.expectOpen(music.uuid);
  });

  test('shows songs from BE', async ({authedPage}) => {
    const songs = [await songApi.create(music.uuid, songRequest()), await songApi.create(music.uuid, songRequest())];
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);

    await expect(songListPage.names).toHaveText(songs.map((song) => song.name).sort());
    await expect(songListPage.pageInfo).toHaveCount(0);
    await expect(songListPage.noData).toHaveCount(0);
  });

  test('shows no table and no data message for music without songs', async ({authedPage}) => {
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);

    await songListPage.expectOpen(music.uuid);
    await expect(songListPage.table).toHaveCount(0);
    await expect(songListPage.noData).toHaveText('No songs');
  });

  test('shows main menu, music menu and song menu', async ({authedPage}) => {
    const songListPage = new SongListPage(authedPage);
    const musicListPage = new MusicListPage(authedPage);
    await songListPage.goto(music.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(musicListPage.listNavigation).toBeVisible();
    await expect(musicListPage.addNavigation).toBeVisible();
    await expect(songListPage.listNavigation).toBeVisible();
    await expect(songListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);
    await songListPage.openAdd();

    await new SongFormPage(authedPage).expectAddOpen(music.uuid);
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const songListPage = new SongListPage(authedPage);
    await new SongFormPage(authedPage).gotoAdd(music.uuid);
    await songListPage.openList();

    await songListPage.expectOpen(music.uuid);
  });

  test('opens detail of the song', async ({authedPage}) => {
    const song = await songApi.create(music.uuid, songRequest());
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);
    await songListPage.openDetail(song.name);

    await new SongDetailPage(authedPage).expectOpen(music.uuid, song.uuid);
  });

  test('opens edit form with the song', async ({authedPage}) => {
    const song = await songApi.create(music.uuid, songRequest({length: 3725, note: 'Note'}));
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);
    await songListPage.edit(song.name);

    await new SongFormPage(authedPage).expectEditOpen(music.uuid, song.uuid, {name: song.name, hours: 1, minutes: 2, seconds: 5, note: 'Note'});
  });

  test('duplicates a song', async ({authedPage}) => {
    const song = await songApi.create(music.uuid, songRequest({length: 125, note: 'Note'}));
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);
    await songListPage.duplicate(song.name);

    await songListPage.expectRowCount(song.name, 2);
    const songs = (await songApi.list(music.uuid)).data;
    expect(songs).toHaveLength(2);
    for (const item of songs) {
      expect(item).toMatchObject({name: song.name, length: 125, note: 'Note'});
    }
    expect((await musicApi.get(music.uuid)).songsCount).toBe(2);
  });

  test('removes a song', async ({authedPage}) => {
    const song = await songApi.create(music.uuid, songRequest());
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);
    await songListPage.remove(song.name);

    await songListPage.expectRowCount(song.name, 0);
    expect((await songApi.list(music.uuid)).data).toHaveLength(0);
  });

  test('pages through the songs', async ({authedPage}) => {
    for (let i = 0; i <= ITEMS_PER_PAGE; i++) {
      await songApi.create(music.uuid, songRequest());
    }
    const songListPage = new SongListPage(authedPage);
    await songListPage.goto(music.uuid);

    await expect(songListPage.names).toHaveCount(ITEMS_PER_PAGE);
    await songListPage.expectPage('1 / 2');
    await expect(songListPage.first).toHaveCount(0);
    await expect(songListPage.previous).toHaveCount(0);

    await songListPage.next.click();
    await expect(songListPage.names).toHaveCount(1);
    await songListPage.expectPage('2 / 2');
    await expect(songListPage.next).toHaveCount(0);
    await expect(songListPage.last).toHaveCount(0);

    await songListPage.previous.click();
    await expect(songListPage.names).toHaveCount(ITEMS_PER_PAGE);
    await songListPage.expectPage('1 / 2');

    await songListPage.last.click();
    await expect(songListPage.names).toHaveCount(1);
    await songListPage.expectPage('2 / 2');

    await songListPage.first.click();
    await expect(songListPage.names).toHaveCount(ITEMS_PER_PAGE);
    await songListPage.expectPage('1 / 2');
  });

});
