import { jokeApi } from '../../api/resources/JokeApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { JokeFormPage } from '../../pages/jokes/JokeFormPage';
import { JokeListPage } from '../../pages/jokes/JokeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { INVALID_UUID, jokeRequest, uniqueName } from '../../utils/testData';

test.describe('edit joke (/jokes/:uuid)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/jokes/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the joke from BE', async ({authedPage}) => {
    const joke = await jokeApi.create({content: `${uniqueName('Joke')}\nsecond line`});
    try {
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeFormPage.gotoEdit(joke.uuid);

      await jokeFormPage.expectEditOpen(joke.uuid, joke.content);
      await expect(jokeFormPage.cancelButton).toBeVisible();
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('updates the joke and stores it in BE', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    const newContent = uniqueName('Joke');
    try {
      const jokeListPage = new JokeListPage(authedPage);
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeListPage.gotoRow(joke.content);
      await jokeListPage.edit(joke.content);
      await jokeFormPage.expectEditOpen(joke.uuid, joke.content);
      await jokeFormPage.update(newContent);

      await jokeListPage.expectOpen();
      await jokeListPage.gotoRow(newContent);
      expect((await jokeApi.get(joke.uuid)).content).toBe(newContent);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('saving without changes keeps the joke unchanged', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeFormPage.gotoEdit(joke.uuid);
      await jokeFormPage.expectEditOpen(joke.uuid, joke.content);
      await jokeFormPage.updateButton.click();

      await jokeListPage.expectOpen();
      expect(await jokeApi.get(joke.uuid)).toEqual(joke);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeFormPage.gotoEdit(joke.uuid);
      await jokeFormPage.expectEditOpen(joke.uuid, joke.content);
      await jokeFormPage.content.fill(uniqueName('Joke'));
      await jokeFormPage.cancel();

      await jokeListPage.expectOpen();
      expect((await jokeApi.get(joke.uuid)).content).toBe(joke.content);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows main menu and joke menu', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeListPage = new JokeListPage(authedPage);
      await new JokeFormPage(authedPage).gotoEdit(joke.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(jokeListPage.listNavigation).toBeVisible();
      await expect(jokeListPage.addNavigation).toBeVisible();
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    try {
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeFormPage.gotoEdit(joke.uuid);
      await jokeFormPage.expectEditOpen(joke.uuid, joke.content);
      await jokeFormPage.update('');

      await jokeFormPage.expectError('Content is required');
      await jokeFormPage.expectEditOpen(joke.uuid, '');
      expect((await jokeApi.get(joke.uuid)).content).toBe(joke.content);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const joke = await jokeApi.create(jokeRequest());
    const newContent = uniqueName('Joke');
    try {
      const jokeListPage = new JokeListPage(authedPage);
      const jokeFormPage = new JokeFormPage(authedPage);
      await jokeFormPage.gotoEdit(joke.uuid);
      await jokeFormPage.expectEditOpen(joke.uuid, joke.content);
      await jokeFormPage.update('');
      await jokeFormPage.expectError('Content is required');
      await jokeFormPage.update(newContent);

      await jokeFormPage.expectNoError('Content is required');
      await jokeListPage.expectOpen();
      expect((await jokeApi.get(joke.uuid)).content).toBe(newContent);
    } finally {
      await jokeApi.delete(joke.uuid);
    }
  });

});
