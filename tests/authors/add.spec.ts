import { authorApi } from '../../api/resources/AuthorApi';
import { expect, test } from '../../fixtures/test';
import { AuthorFormPage } from '../../pages/authors/AuthorFormPage';
import { AuthorListPage } from '../../pages/authors/AuthorListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { uniqueName } from '../../utils/testData';

test.describe('add author (/authors/add)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/authors/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const authorFormPage = new AuthorFormPage(authedPage);
    await authorFormPage.gotoAdd();

    await authorFormPage.expectAddOpen();
    await expect(authorFormPage.firstName).toHaveValue('');
    await expect(authorFormPage.middleName).toHaveValue('');
    await expect(authorFormPage.lastName).toHaveValue('');
    await expect(authorFormPage.cancelButton).toBeVisible();
  });

  test('adds an author and stores it in BE', async ({authedPage}) => {
    const lastName = uniqueName('Author');
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorListPage.goto();
      await authorListPage.openAdd();
      await authorFormPage.expectAddOpen();
      await authorFormPage.create({firstName: 'First', middleName: 'Middle', lastName});

      await authorListPage.expectOpen();
      await authorListPage.search({lastName});
      await authorListPage.expectRowCount(`First Middle ${lastName}`, 1);
      const authors = await authorApi.search({lastName});
      expect(authors).toHaveLength(1);
      expect(authors[0]).toMatchObject({firstName: 'First', middleName: 'Middle', lastName});
    } finally {
      await authorApi.deleteByLastName(lastName);
    }
  });

  test('adds an author without middle name', async ({authedPage}) => {
    const lastName = uniqueName('Author');
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoAdd();
      await authorFormPage.create({firstName: 'First', lastName});

      await authorListPage.expectOpen();
      const authors = await authorApi.search({lastName});
      expect(authors).toHaveLength(1);
      expect(authors[0].firstName).toBe('First');
      expect(authors[0].middleName ?? null).toBeNull();
    } finally {
      await authorApi.deleteByLastName(lastName);
    }
  });

  test('adds an author with the maximum field values', async ({authedPage}) => {
    const firstName = 'a'.repeat(100);
    const middleName = 'b'.repeat(100);
    const lastName = uniqueName('Author').padEnd(100, 'c');
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoAdd();
      await authorFormPage.create({firstName, middleName, lastName});

      await authorListPage.expectOpen();
      const authors = await authorApi.search({lastName});
      expect(authors).toHaveLength(1);
      expect(authors[0]).toMatchObject({firstName, middleName, lastName});
    } finally {
      await authorApi.deleteByLastName(lastName);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const lastName = uniqueName('Author');
    const authorListPage = new AuthorListPage(authedPage);
    const authorFormPage = new AuthorFormPage(authedPage);
    await authorFormPage.gotoAdd();
    await authorFormPage.fill({firstName: 'First', lastName});
    await authorFormPage.cancel();

    await authorListPage.expectOpen();
    expect(await authorApi.search({lastName})).toHaveLength(0);
  });

  test('shows main menu and author menu', async ({authedPage}) => {
    const authorListPage = new AuthorListPage(authedPage);
    await new AuthorFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(authorListPage.listNavigation).toBeVisible();
    await expect(authorListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const authorFormPage = new AuthorFormPage(authedPage);
    await authorFormPage.gotoAdd();
    await authorFormPage.create({firstName: '', lastName: ''});

    await authorFormPage.expectError('First name is required');
    await authorFormPage.expectError('Last name is required');
    await authorFormPage.expectNoError('Middle name is required');
    await authorFormPage.expectAddOpen();
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const lastName = 'c'.repeat(101);
    const authorFormPage = new AuthorFormPage(authedPage);
    await authorFormPage.gotoAdd();
    await authorFormPage.create({firstName: 'a'.repeat(101), middleName: 'b'.repeat(101), lastName});

    await authorFormPage.expectError('Maximum length of first name is 100');
    await authorFormPage.expectError('Maximum length of middle name is 100');
    await authorFormPage.expectError('Maximum length of last name is 100');
    await authorFormPage.expectAddOpen();
    expect(await authorApi.search({lastName})).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const lastName = uniqueName('Author');
    try {
      const authorListPage = new AuthorListPage(authedPage);
      const authorFormPage = new AuthorFormPage(authedPage);
      await authorFormPage.gotoAdd();
      await authorFormPage.create({firstName: '', lastName: ''});
      await authorFormPage.expectError('First name is required');
      await authorFormPage.expectError('Last name is required');
      await authorFormPage.create({firstName: 'First', lastName});

      await authorFormPage.expectNoError('First name is required');
      await authorFormPage.expectNoError('Last name is required');
      await authorListPage.expectOpen();
    } finally {
      await authorApi.deleteByLastName(lastName);
    }
  });

});
