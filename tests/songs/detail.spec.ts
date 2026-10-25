import { type Music, musicApi } from '../../api/resources/MusicApi';
import { songApi } from '../../api/resources/SongApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { SongDetailPage } from '../../pages/songs/SongDetailPage';
import { SongListPage } from '../../pages/songs/SongListPage';
import { INVALID_UUID, musicRequest, songRequest } from '../../utils/testData';

test.describe('song detail (/music/:music/songs/:uuid/detail)', () => {

  let music: Music;

  test.beforeEach(async () => {
    music = await musicApi.create(musicRequest());
  });

  test.afterEach(async () => {
    await musicApi.delete(music.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/music/${INVALID_UUID}/songs/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the song from BE', async ({authedPage}) => {
    const song = await songApi.create(music.uuid, songRequest({length: 3725, note: 'Note'}));
    const songDetailPage = new SongDetailPage(authedPage);
    await songDetailPage.goto(music.uuid, song.uuid);

    await songDetailPage.expectOpen(music.uuid, song.uuid);
    await expect(songDetailPage.value('Name')).toHaveText(song.name);
    await expect(songDetailPage.value('Length')).toHaveText('1:02:05');
    await expect(songDetailPage.value('Note')).toHaveText('Note');
  });

  test('hides the note when it is not set', async ({authedPage}) => {
    const song = await songApi.create(music.uuid, songRequest({length: 65}));
    const songDetailPage = new SongDetailPage(authedPage);
    await songDetailPage.goto(music.uuid, song.uuid);

    await expect(songDetailPage.value('Length')).toHaveText('0:01:05');
    await expect(songDetailPage.row('Note')).toHaveCount(0);
  });

  test('shows main menu, music menu and song menu', async ({authedPage}) => {
    const song = await songApi.create(music.uuid, songRequest());
    const musicListPage = new MusicListPage(authedPage);
    const songListPage = new SongListPage(authedPage);
    await new SongDetailPage(authedPage).goto(music.uuid, song.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(musicListPage.listNavigation).toBeVisible();
    await expect(musicListPage.addNavigation).toBeVisible();
    await expect(songListPage.listNavigation).toBeVisible();
    await expect(songListPage.addNavigation).toBeVisible();
  });

});
