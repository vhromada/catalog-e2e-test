import { musicApi } from '../../api/resources/MusicApi';
import { songApi } from '../../api/resources/SongApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MusicDetailPage } from '../../pages/music/MusicDetailPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { SongListPage } from '../../pages/songs/SongListPage';
import { INVALID_UUID, musicRequest, songRequest } from '../../utils/testData';

test.describe('music detail (/music/:uuid/detail)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/music/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the music from BE', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest({wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', mediaCount: 3, note: 'Note'}));
    try {
      const musicDetailPage = new MusicDetailPage(authedPage);
      await musicDetailPage.goto(music.uuid);

      await musicDetailPage.expectOpen(music.uuid);
      await expect(musicDetailPage.value('Name')).toHaveText(music.name);
      await expect(musicDetailPage.value('Count of media')).toHaveText('3');
      await expect(musicDetailPage.value('Note')).toHaveText('Note');
      await expect(musicDetailPage.wikiCzLink).toHaveAttribute('href', 'https://cz.wikipedia.org/wiki/Wiki_CZ');
      await expect(musicDetailPage.wikiEnLink).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Wiki_EN');
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('hides the optional fields when they are not set', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicDetailPage = new MusicDetailPage(authedPage);
      await musicDetailPage.goto(music.uuid);

      await expect(musicDetailPage.value('Name')).toHaveText(music.name);
      await expect(musicDetailPage.row('Count of songs')).toHaveCount(0);
      await expect(musicDetailPage.row('Total length')).toHaveCount(0);
      await expect(musicDetailPage.row('Note')).toHaveCount(0);
      await expect(musicDetailPage.wikiCzLink).toHaveCount(0);
      await expect(musicDetailPage.wikiEnLink).toHaveCount(0);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('shows count and total length of songs', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      await songApi.create(music.uuid, songRequest({length: 65}));
      await songApi.create(music.uuid, songRequest({length: 3600}));
      const musicDetailPage = new MusicDetailPage(authedPage);
      await musicDetailPage.goto(music.uuid);

      await expect(musicDetailPage.value('Count of songs')).toHaveText('2');
      await expect(musicDetailPage.value('Total length')).toHaveText('1:01:05');
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('opens songs of the music', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicDetailPage = new MusicDetailPage(authedPage);
      await musicDetailPage.goto(music.uuid);
      await musicDetailPage.songsLink.click();

      await new SongListPage(authedPage).expectOpen(music.uuid);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('shows main menu and music menu', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      await new MusicDetailPage(authedPage).goto(music.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(musicListPage.listNavigation).toBeVisible();
      await expect(musicListPage.addNavigation).toBeVisible();
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

});
