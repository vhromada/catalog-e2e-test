import { authorApi } from '../../api/resources/AuthorApi';
import { expect, test } from '../../fixtures/test';
import { AuthorFormPage } from '../../pages/authors/AuthorFormPage';
import { AuthorListPage } from '../../pages/authors/AuthorListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorRequest, INVALID_UUID, uniqueName } from '../../utils/testData';

test.describe('edit author (/authors/:uuid)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/authors/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the author from BE', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest({middleName: 'Middle'}));
    try {
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);

      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, middleName: 'Middle', lastName: author.lastName});
      await expect(authorFormPage.cancelButton).toBeVisible();
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('prefills the form with an author without middle name', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    try {
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);

      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, lastName: author.lastName});
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('updates the author and stores it in BE', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    const lastName = uniqueName('Author');
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({lastName: author.lastName});
      await authorListPage.edit(author.lastName);
      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, lastName: author.lastName});
      await authorFormPage.update({firstName: 'Changed', middleName: 'Middle', lastName});

      await authorListPage.expectOpen();
      await authorListPage.search({lastName});
      await authorListPage.expectRowCount(`Changed Middle ${lastName}`, 1);
      expect(await authorApi.get(author.uuid)).toMatchObject({firstName: 'Changed', middleName: 'Middle', lastName});
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('clears the middle name', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest({middleName: 'Middle'}));
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);
      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, middleName: 'Middle', lastName: author.lastName});
      await authorFormPage.update({firstName: author.firstName, lastName: author.lastName});

      await authorListPage.expectOpen();
      expect((await authorApi.get(author.uuid)).middleName ?? null).toBeNull();
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('updates the author with the maximum field values', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    const values = {firstName: 'a'.repeat(100), middleName: 'b'.repeat(100), lastName: 'c'.repeat(100)};
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);
      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, lastName: author.lastName});
      await authorFormPage.update(values);

      await authorListPage.expectOpen();
      expect(await authorApi.get(author.uuid)).toMatchObject(values);
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('saving without changes keeps the author unchanged', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest({middleName: 'Middle'}));
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);
      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, middleName: 'Middle', lastName: author.lastName});
      await authorFormPage.updateButton.click();

      await authorListPage.expectOpen();
      expect(await authorApi.get(author.uuid)).toEqual(author);
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);
      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, lastName: author.lastName});
      await authorFormPage.fill({firstName: 'Changed', lastName: uniqueName('Author')});
      await authorFormPage.cancel();

      await authorListPage.expectOpen();
      expect(await authorApi.get(author.uuid)).toEqual(author);
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('shows main menu and author menu', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await new AuthorFormPage(authedPage).gotoEdit(author.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(authorListPage.listNavigation).toBeVisible();
      await expect(authorListPage.addNavigation).toBeVisible();
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    try {
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);
      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, lastName: author.lastName});
      await authorFormPage.update({firstName: '', lastName: ''});

      await authorFormPage.expectError('First name is required');
      await authorFormPage.expectError('Last name is required');
      await authorFormPage.expectEditOpen(author.uuid, {firstName: '', lastName: ''});
      expect(await authorApi.get(author.uuid)).toEqual(author);
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    const values = {firstName: 'a'.repeat(101), middleName: 'b'.repeat(101), lastName: 'c'.repeat(101)};
    try {
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);
      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, lastName: author.lastName});
      await authorFormPage.update(values);

      await authorFormPage.expectError('Maximum length of first name is 100');
      await authorFormPage.expectError('Maximum length of middle name is 100');
      await authorFormPage.expectError('Maximum length of last name is 100');
      await authorFormPage.expectEditOpen(author.uuid, values);
      expect(await authorApi.get(author.uuid)).toEqual(author);
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    const lastName = uniqueName('Author');
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoEdit(author.uuid);
      await authorFormPage.expectEditOpen(author.uuid, {firstName: author.firstName, lastName: author.lastName});
      await authorFormPage.update({firstName: '', lastName: ''});
      await authorFormPage.expectError('First name is required');
      await authorFormPage.expectError('Last name is required');
      await authorFormPage.update({firstName: 'Changed', lastName});

      await authorFormPage.expectNoError('First name is required');
      await authorFormPage.expectNoError('Last name is required');
      await authorListPage.expectOpen();
      expect(await authorApi.get(author.uuid)).toMatchObject({firstName: 'Changed', lastName});
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

});
