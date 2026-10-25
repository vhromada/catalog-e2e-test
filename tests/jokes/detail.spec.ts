import { jokeApi } from '../../api/resources/JokeApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { JokeDetailPage } from '../../pages/jokes/JokeDetailPage';
import { JokeListPage } from '../../pages/jokes/JokeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { INVALID_UUID, jokeRequest, uniqueName } from '../../utils/testData';

test.describe('joke detail (/jokes/:uuid/detail)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/jokes/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the joke from BE', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeDetailPage = new JokeDetailPage(authedPage);
      await jokeDetailPage.goto(joke.uuid);

      await jokeDetailPage.expectOpen(joke.uuid);
      await expect(jokeDetailPage.content).toHaveText(joke.content);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows new lines as line breaks', async ({authedPage}) => {
    const name = uniqueName('Joke');
    const joke = await jokeApi.create({content: `${name}\nsecond line`});
    try {
      const jokeDetailPage = new JokeDetailPage(authedPage);
      await jokeDetailPage.goto(joke.uuid);

      await expect(jokeDetailPage.content).toContainText(name);
      await expect(jokeDetailPage.content).toContainText('second line');
      await expect(jokeDetailPage.content.locator('br')).toHaveCount(1);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows HTML in the joke as text', async ({authedPage}) => {
    const joke = await jokeApi.create({content: `${uniqueName('Joke')} <b>bold</b>`});
    try {
      const jokeDetailPage = new JokeDetailPage(authedPage);
      await jokeDetailPage.goto(joke.uuid);

      await expect(jokeDetailPage.content).toContainText('<b>bold</b>');
      await expect(jokeDetailPage.content.locator('b')).toHaveCount(0);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows main menu and joke menu', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await new JokeDetailPage(authedPage).goto(joke.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(jokeListPage.listNavigation).toBeVisible();
      await expect(jokeListPage.addNavigation).toBeVisible();
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

});
