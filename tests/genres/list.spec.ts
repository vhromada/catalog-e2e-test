import { genreApi } from '../../api/resources/GenreApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GenreFormPage } from '../../pages/genres/GenreFormPage';
import { GenreListPage } from '../../pages/genres/GenreListPage';
import { LoginPage } from '../../pages/LoginPage';
import { genreRequest, ITEMS_PER_PAGE, pagesCount } from '../../utils/testData';

test.describe('genre list (/genres)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/genres');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading, search form and statistics', async ({authedPage}) => {
    const genreListPage = new GenreListPage(authedPage);
    await genreListPage.goto();

    await genreListPage.expectOpen();
    await expect(genreListPage.searchName).toBeVisible();
    await expect(genreListPage.searchButton).toBeVisible();
    await expect(genreListPage.count).toHaveText(/\d+/);
  });

  test('shows count of genres from BE', async ({authedPage}) => {
    const genreListPage = new GenreListPage(authedPage);

    await expect(async () => {
      const before = await genreApi.statistics();
      await genreListPage.goto();
      await expect(genreListPage.count).toHaveText(/\d+/);
      const shown = await genreListPage.count.innerText();
      const after = await genreApi.statistics();

      expect(after.count).toBe(before.count);
      expect(shown).toBe(String(before.count));
    }).toPass();
  });

  test('shows first page of genres from BE', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);

      await expect(async () => {
        const before = await genreApi.list(1, ITEMS_PER_PAGE);
        const {count} = await genreApi.statistics();
        await genreListPage.goto();
        await expect(genreListPage.table).toBeVisible();
        const shown = await genreListPage.names.allInnerTexts();
        const pageInfo = await genreListPage.pageInfo.allInnerTexts();
        const after = await genreApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => item.name));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('shows genres stored in BE', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);

      await genreListPage.expectRowCount(genre.name, 1);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('searches genres by name', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    const other = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);

      await genreListPage.expectRowCount(genre.name, 1);
      await genreListPage.expectRowCount(other.name, 0);
    } finally {
      await genreApi.delete(genre.uuid);
      await genreApi.delete(other.uuid);
    }
  });

  test('shows no table when search finds nothing', async ({authedPage}) => {
    const genreListPage = new GenreListPage(authedPage);
    await genreListPage.goto();
    await genreListPage.search(genreRequest().name);

    await expect(genreListPage.table).toHaveCount(0);
  });

  test('shows main menu and genre menu', async ({authedPage}) => {
    const genreListPage = new GenreListPage(authedPage);
    await genreListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(genreListPage.listNavigation).toBeVisible();
    await expect(genreListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const genreListPage = new GenreListPage(authedPage);
    await genreListPage.goto();
    await genreListPage.openAdd();

    await new GenreFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const genreFormPage = new GenreFormPage(authedPage);
    const genreListPage = new GenreListPage(authedPage);
    await genreFormPage.gotoAdd();
    await genreListPage.openList();

    await genreListPage.expectOpen();
  });

  test('opens edit form with the genre', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);
      await genreListPage.edit(genre.name);

      await new GenreFormPage(authedPage).expectEditOpen(genre.uuid, genre.name);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('duplicates a genre', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);
      await genreListPage.duplicate(genre.name);

      await genreListPage.expectRowCount(genre.name, 2);
      expect(await genreApi.search(genre.name)).toHaveLength(2);
    } finally {
      await genreApi.deleteByName(genre.name);
    }
  });

  test('removes a genre', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);
      await genreListPage.remove(genre.name);

      await genreListPage.expectRowCount(genre.name, 0);
      expect(await genreApi.search(genre.name)).toHaveLength(0);
    } finally {
      await genreApi.deleteByName(genre.name);
    }
  });

  test('does not show paging for a single page of results', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);

      await genreListPage.expectRowCount(genre.name, 1);
      await expect(genreListPage.pageInfo).toHaveCount(0);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

  test('pages through search results', async ({authedPage}) => {
    const prefix = genreRequest().name;
    const genres = await Promise.all(Array.from({length: 6}, (_, i) => genreApi.create({name: `${prefix} ${i}`})));
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(prefix);

      await genreListPage.expectRowCount(prefix, 5);
      await genreListPage.expectPage('1 / 2');
      await expect(genreListPage.first).toHaveCount(0);
      await expect(genreListPage.previous).toHaveCount(0);

      await genreListPage.next.click();
      await genreListPage.expectRowCount(prefix, 1);
      await genreListPage.expectPage('2 / 2');
      await expect(genreListPage.next).toHaveCount(0);
      await expect(genreListPage.last).toHaveCount(0);

      await genreListPage.previous.click();
      await genreListPage.expectRowCount(prefix, 5);
      await genreListPage.expectPage('1 / 2');

      await genreListPage.last.click();
      await genreListPage.expectRowCount(prefix, 1);
      await genreListPage.expectPage('2 / 2');

      await genreListPage.first.click();
      await genreListPage.expectRowCount(prefix, 5);
      await genreListPage.expectPage('1 / 2');
    } finally {
      await Promise.all(genres.map((genre) => genreApi.delete(genre.uuid)));
    }
  });

});
