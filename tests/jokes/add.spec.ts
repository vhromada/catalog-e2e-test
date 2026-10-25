import { jokeApi } from '../../api/resources/JokeApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { JokeFormPage } from '../../pages/jokes/JokeFormPage';
import { JokeListPage } from '../../pages/jokes/JokeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { uniqueName } from '../../utils/testData';

test.describe('add joke (/jokes/add)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/jokes/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const jokeFormPage = new JokeFormPage(authedPage);
    await jokeFormPage.gotoAdd();

    await jokeFormPage.expectAddOpen();
    await expect(jokeFormPage.content).toHaveValue('');
    await expect(jokeFormPage.cancelButton).toBeVisible();
  });

  test('adds a joke and stores it in BE', async ({authedPage}) => {
    const content = uniqueName('Joke');
    try {
      const jokeListPage = new JokeListPage(authedPage);
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeListPage.goto();
      await jokeListPage.openAdd();
      await jokeFormPage.expectAddOpen();
      await jokeFormPage.create(content);

      await jokeListPage.expectOpen();
      await jokeListPage.gotoRow(content);
      const jokes = await jokeApi.findByContent(content);
      expect(jokes).toHaveLength(1);
      expect(jokes[0].content).toBe(content);
    } finally {
      await jokeApi.deleteByContent(content);
    }
  });

  test('adds a joke with multiple lines', async ({authedPage}) => {
    const name = uniqueName('Joke');
    const content = `${name}\nsecond line`;
    try {
      const jokeListPage = new JokeListPage(authedPage);
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeFormPage.gotoAdd();
      await jokeFormPage.create(content);

      await jokeListPage.expectOpen();
      const jokes = await jokeApi.findByContent(name);
      expect(jokes).toHaveLength(1);
      expect(jokes[0].content).toBe(content);
    } finally {
      await jokeApi.deleteByContent(name);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const content = uniqueName('Joke');
    const jokeListPage = new JokeListPage(authedPage);
    const jokeFormPage = new JokeFormPage(authedPage);
    await jokeFormPage.gotoAdd();
    await jokeFormPage.content.fill(content);
    await jokeFormPage.cancel();

    await jokeListPage.expectOpen();
    expect(await jokeApi.findByContent(content)).toHaveLength(0);
  });

  test('shows main menu and joke menu', async ({authedPage}) => {
    const jokeListPage = new JokeListPage(authedPage);
    await new JokeFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(jokeListPage.listNavigation).toBeVisible();
    await expect(jokeListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const jokeFormPage = new JokeFormPage(authedPage);
    await jokeFormPage.gotoAdd();
    await jokeFormPage.create('');

    await jokeFormPage.expectError('Content is required');
    await jokeFormPage.expectAddOpen();
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const content = uniqueName('Joke');
    try {
      const jokeListPage = new JokeListPage(authedPage);
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeFormPage.gotoAdd();
      await jokeFormPage.create('');
      await jokeFormPage.expectError('Content is required');
      await jokeFormPage.create(content);

      await jokeFormPage.expectNoError('Content is required');
      await jokeListPage.expectOpen();
      expect(await jokeApi.findByContent(content)).toHaveLength(1);
    } finally {
      await jokeApi.deleteByContent(content);
    }
  });

});
