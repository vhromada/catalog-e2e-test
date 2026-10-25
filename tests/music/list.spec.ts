import { musicApi } from '../../api/resources/MusicApi';
import { songApi } from '../../api/resources/SongApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { MusicDetailPage } from '../../pages/music/MusicDetailPage';
import { MusicFormPage } from '../../pages/music/MusicFormPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { SongListPage } from '../../pages/songs/SongListPage';
import { ITEMS_PER_PAGE, musicRequest, pagesCount, songRequest } from '../../utils/testData';

test.describe('music list (/music)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/music');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading, search form and statistics', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);
    await musicListPage.goto();

    await musicListPage.expectOpen();
    await expect(musicListPage.searchName).toBeVisible();
    await expect(musicListPage.searchButton).toBeVisible();
    await expect(musicListPage.count).toHaveText(/\d+/);
    await expect(musicListPage.mediaCount).toHaveText(/\d+/);
    await expect(musicListPage.songsCount).toHaveText(/\d+/);
    await expect(musicListPage.totalLength).toHaveText(/\d+:\d{2}:\d{2}/);
  });

  // The DB is shared with tests running in parallel, so the BE data is compared only when it did not change while the FE was loading.
  test('shows statistics from BE', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);

    await expect(async () => {
      const before = await musicApi.statistics();
      await musicListPage.goto();
      await expect(musicListPage.count).toHaveText(/\d+/);
      const shown = [
        await musicListPage.count.innerText(),
        await musicListPage.mediaCount.innerText(),
        await musicListPage.songsCount.innerText(),
        await musicListPage.totalLength.innerText()
      ];
      const after = await musicApi.statistics();

      expect(after).toEqual(before);
      expect(shown).toEqual([String(before.count), String(before.mediaCount), String(before.songsCount), before.length]);
    }).toPass();
  });

  test('shows first page of music from BE', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);

      await expect(async () => {
        const before = await musicApi.list(1, ITEMS_PER_PAGE);
        const {count} = await musicApi.statistics();
        await musicListPage.goto();
        await expect(musicListPage.table).toBeVisible();
        const shown = await musicListPage.names.allInnerTexts();
        const pageInfo = await musicListPage.pageInfo.allInnerTexts();
        const after = await musicApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => item.name));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('shows music stored in BE', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);

      await musicListPage.expectRowCount(music.name, 1);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('searches music by name', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    const other = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);

      await musicListPage.expectRowCount(music.name, 1);
      await musicListPage.expectRowCount(other.name, 0);
    } finally {
      await musicApi.delete(music.uuid);
      await musicApi.delete(other.uuid);
    }
  });

  test('shows no table when search finds nothing', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);
    await musicListPage.goto();
    await musicListPage.search(musicRequest().name);

    await expect(musicListPage.table).toHaveCount(0);
  });

  test('shows main menu and music menu', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);
    await musicListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(musicListPage.listNavigation).toBeVisible();
    await expect(musicListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);
    await musicListPage.goto();
    await musicListPage.openAdd();

    await new MusicFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const musicListPage = new MusicListPage(authedPage);
    await new MusicFormPage(authedPage).gotoAdd();
    await musicListPage.openList();

    await musicListPage.expectOpen();
  });

  test('opens detail of the music', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);
      await musicListPage.openDetail(music.name);

      await new MusicDetailPage(authedPage).expectOpen(music.uuid);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('opens songs of the music', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);
      await musicListPage.openSongs(music.name);

      await new SongListPage(authedPage).expectOpen(music.uuid);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('opens edit form with the music', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest({wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', mediaCount: 3, note: 'Note'}));
    try {
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);
      await musicListPage.edit(music.name);

      await new MusicFormPage(authedPage).expectEditOpen(music.uuid, {name: music.name, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', mediaCount: 3, note: 'Note'});
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('duplicates music with its songs', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest({mediaCount: 2, note: 'Note'}));
    try {
      await songApi.create(music.uuid, songRequest({length: 90}));
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);
      await musicListPage.duplicate(music.name);

      await musicListPage.expectRowCount(music.name, 2);
      const musicList = await musicApi.search(music.name);
      expect(musicList).toHaveLength(2);
      for (const item of musicList) {
        expect(item).toMatchObject({name: music.name, mediaCount: 2, note: 'Note', songsCount: 1, length: 90});
      }
    } finally {
      await musicApi.deleteByName(music.name);
    }
  });

  test('removes music', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);
      await musicListPage.remove(music.name);

      await musicListPage.expectRowCount(music.name, 0);
      expect(await musicApi.search(music.name)).toHaveLength(0);
    } finally {
      await musicApi.deleteByName(music.name);
    }
  });

  test('does not show paging for a single page of results', async ({authedPage}) => {
    const music = await musicApi.create(musicRequest());
    try {
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(music.name);

      await musicListPage.expectRowCount(music.name, 1);
      await expect(musicListPage.pageInfo).toHaveCount(0);
    } finally {
      await musicApi.delete(music.uuid);
    }
  });

  test('pages through search results', async ({authedPage}) => {
    const prefix = musicRequest().name;
    const musicList = await Promise.all(Array.from({length: ITEMS_PER_PAGE + 1}, (_, i) => musicApi.create(musicRequest({name: `${prefix} ${i}`}))));
    try {
      const musicListPage = new MusicListPage(authedPage);
      await musicListPage.goto();
      await musicListPage.search(prefix);

      await musicListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await musicListPage.expectPage('1 / 2');
      await expect(musicListPage.first).toHaveCount(0);
      await expect(musicListPage.previous).toHaveCount(0);

      await musicListPage.next.click();
      await musicListPage.expectRowCount(prefix, 1);
      await musicListPage.expectPage('2 / 2');
      await expect(musicListPage.next).toHaveCount(0);
      await expect(musicListPage.last).toHaveCount(0);

      await musicListPage.previous.click();
      await musicListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await musicListPage.expectPage('1 / 2');

      await musicListPage.last.click();
      await musicListPage.expectRowCount(prefix, 1);
      await musicListPage.expectPage('2 / 2');

      await musicListPage.first.click();
      await musicListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await musicListPage.expectPage('1 / 2');
    } finally {
      await Promise.all(musicList.map((music) => musicApi.delete(music.uuid)));
    }
  });

});
