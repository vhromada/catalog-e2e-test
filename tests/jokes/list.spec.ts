import { jokeApi } from '../../api/resources/JokeApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { JokeDetailPage } from '../../pages/jokes/JokeDetailPage';
import { JokeFormPage } from '../../pages/jokes/JokeFormPage';
import { JokeListPage } from '../../pages/jokes/JokeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { ITEMS_PER_PAGE, jokeListText, jokeRequest, pagesCount, uniqueName } from '../../utils/testData';

test.describe('joke list (/jokes)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/jokes');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading and statistics', async ({authedPage}) => {
    const jokeListPage = new JokeListPage(authedPage);
    await jokeListPage.goto();

    await jokeListPage.expectOpen();
    await expect(jokeListPage.count).toHaveText(/\d+/);
  });

  // The DB is shared with tests running in parallel, so the BE data is compared only when it did not change while the FE was loading.
  test('shows count of jokes from BE', async ({authedPage}) => {
    const jokeListPage = new JokeListPage(authedPage);

    await expect(async () => {
      const before = await jokeApi.statistics();
      await jokeListPage.goto();
      await expect(jokeListPage.count).toHaveText(/\d+/);
      const shown = await jokeListPage.count.innerText();
      const after = await jokeApi.statistics();

      expect(after.count).toBe(before.count);
      expect(shown).toBe(String(before.count));
    }).toPass();
  });

  test('shows first page of jokes from BE', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);

      await expect(async () => {
        const before = await jokeApi.list(1, ITEMS_PER_PAGE);
        const {count} = await jokeApi.statistics();
        await jokeListPage.goto();
        await expect(jokeListPage.table).toBeVisible();
        const shown = await jokeListPage.names.allInnerTexts();
        const pageInfo = await jokeListPage.pageInfo.allInnerTexts();
        const after = await jokeApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => jokeListText(item.content)));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows jokes stored in BE', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await jokeListPage.gotoRow(joke.content);

      await jokeListPage.expectRowCount(joke.content, 1);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows only the first 100 characters of a long joke', async ({authedPage}) => {
    const joke = await jokeApi.create({content: `${uniqueName('Joke')} ${'a'.repeat(120)}`});
    const marker = joke.content.slice(0, 50);
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await jokeListPage.gotoRow(marker);

      await expect(jokeListPage.row(marker).locator('td[data-nav="name"]')).toHaveText(joke.content.slice(0, 100));
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows new lines of a joke as spaces', async ({authedPage}) => {
    const name = uniqueName('Joke');
    const joke = await jokeApi.create({content: `${name}\nsecond line`});
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await jokeListPage.gotoRow(name);

      await expect(jokeListPage.row(name).locator('td[data-nav="name"]')).toHaveText(`${name} second line`);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows main menu and joke menu', async ({authedPage}) => {
    const jokeListPage = new JokeListPage(authedPage);
    await jokeListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(jokeListPage.listNavigation).toBeVisible();
    await expect(jokeListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const jokeListPage = new JokeListPage(authedPage);
    await jokeListPage.goto();
    await jokeListPage.openAdd();

    await new JokeFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const jokeListPage = new JokeListPage(authedPage);
    await new JokeFormPage(authedPage).gotoAdd();
    await jokeListPage.openList();

    await jokeListPage.expectOpen();
  });

  test('opens detail of the joke', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await jokeListPage.gotoRow(joke.content);
      await jokeListPage.openDetail(joke.content);

      const jokeDetailPage = new JokeDetailPage(authedPage);
      await jokeDetailPage.expectOpen(joke.uuid);
      await expect(jokeDetailPage.content).toHaveText(joke.content);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('opens edit form with the joke', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await jokeListPage.gotoRow(joke.content);
      await jokeListPage.edit(joke.content);

      await new JokeFormPage(authedPage).expectEditOpen(joke.uuid, joke.content);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('removes a joke', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await jokeListPage.gotoRow(joke.content);
      await jokeListPage.remove(joke.content);

      await jokeListPage.expectRowCount(joke.content, 0);
      expect(await jokeApi.findByContent(joke.content)).toHaveLength(0);
    } finally {
      await jokeApi.deleteByContent(joke.content);
    }
  });

  test('pages through the jokes', async ({authedPage}) => {
    const jokes = await Promise.all(Array.from({length: 6}, () => jokeApi.create(jokeRequest())));
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await jokeListPage.goto();
      await expect(jokeListPage.pageInfo).toHaveText(/^1 \/ \d+$/);
      await expect(jokeListPage.first).toHaveCount(0);
      await expect(jokeListPage.previous).toHaveCount(0);

      await jokeListPage.next.click();
      await expect(jokeListPage.pageInfo).toHaveText(/^2 \/ \d+$/);
      await expect(jokeListPage.first).toBeVisible();
      await expect(jokeListPage.previous).toBeVisible();

      await jokeListPage.previous.click();
      await expect(jokeListPage.pageInfo).toHaveText(/^1 \/ \d+$/);

      await jokeListPage.last.click();
      await expect(jokeListPage.pageInfo).toHaveText(/^(\d+) \/ \1$/);
      await expect(jokeListPage.next).toHaveCount(0);
      await expect(jokeListPage.last).toHaveCount(0);

      await jokeListPage.first.click();
      await expect(jokeListPage.pageInfo).toHaveText(/^1 \/ \d+$/);
    } finally {
      await Promise.all(jokes.map((joke) => jokeApi.delete(joke.uuid)));
    }
  });

});
