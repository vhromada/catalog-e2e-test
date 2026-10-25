import { type Author, authorApi } from '../../api/resources/AuthorApi';
import { bookApi } from '../../api/resources/BookApi';
import { expect, test } from '../../fixtures/test';
import { BookFormPage } from '../../pages/books/BookFormPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorRequest, uniqueName } from '../../utils/testData';

test.describe('add book (/books/add)', () => {

  let author: Author;

  test.beforeEach(async () => {
    author = await authorApi.create(authorRequest());
  });

  test.afterEach(async () => {
    await authorApi.delete(author.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/books/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const bookFormPage = new BookFormPage(authedPage);
    await bookFormPage.gotoAdd();

    await bookFormPage.expectAddOpen();
    await expect(bookFormPage.czechName).toHaveValue('');
    await expect(bookFormPage.originalName).toHaveValue('');
    await expect(bookFormPage.description).toHaveValue('');
    await expect(bookFormPage.note).toHaveValue('');
    await expect(bookFormPage.authors).toBeVisible();
    expect(await bookFormPage.selectedAuthors()).toEqual([]);
    await expect(bookFormPage.cancelButton).toBeVisible();
  });

  test('lists the authors from BE in the select', async ({authedPage}) => {
    const bookFormPage = new BookFormPage(authedPage);
    await bookFormPage.gotoAdd();

    await expect(bookFormPage.authors.locator(`option[value="${author.uuid}"]`)).toHaveText(`E2E ${author.lastName}`);
  });

  test('adds a book and stores it in BE', async ({authedPage}) => {
    const czechName = uniqueName('Book CZ');
    const values = {czechName, originalName: uniqueName('Book EN'), description: uniqueName('Description'), note: 'Note', authors: [author.uuid]};
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookListPage.goto();
      await bookListPage.openAdd();
      await bookFormPage.expectAddOpen();
      await bookFormPage.create(values);

      await bookListPage.expectOpen();
      await bookListPage.search({czechName});
      await bookListPage.expectRowCount(czechName, 1);
      const books = await bookApi.search(czechName);
      expect(books).toHaveLength(1);
      expect(books[0]).toMatchObject({...values, authors: [author]});
    } finally {
      await bookApi.deleteByCzechName(czechName);
    }
  });

  test('adds a book with more authors and without note', async ({authedPage}) => {
    const second = await authorApi.create(authorRequest());
    const czechName = uniqueName('Book CZ');
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoAdd();
      await bookFormPage.create({czechName, originalName: uniqueName('Book EN'), description: uniqueName('Description'), authors: [author.uuid, second.uuid]});

      await bookListPage.expectOpen();
      const books = await bookApi.search(czechName);
      expect(books).toHaveLength(1);
      expect(books[0].authors.map((item) => item.uuid).sort()).toEqual([author.uuid, second.uuid].sort());
      expect(books[0].note ?? null).toBeNull();
    } finally {
      await bookApi.deleteByCzechName(czechName);
      await authorApi.delete(second.uuid);
    }
  });

  test('adds a book with the maximum field values', async ({authedPage}) => {
    const values = {
      czechName: uniqueName('Book CZ').padEnd(200, 'a'),
      originalName: uniqueName('Book EN').padEnd(100, 'b'),
      description: uniqueName('Description').padEnd(1000, 'c'),
      note: 'd'.repeat(100),
      authors: [author.uuid]
    };
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoAdd();
      await bookFormPage.create(values);

      await bookListPage.expectOpen();
      const books = await bookApi.search(values.czechName);
      expect(books).toHaveLength(1);
      expect(books[0]).toMatchObject({...values, authors: [author]});
    } finally {
      await bookApi.deleteByCzechName(values.czechName);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const czechName = uniqueName('Book CZ');
    const bookListPage = new BookListPage(authedPage);
    const bookFormPage = new BookFormPage(authedPage);
    await bookFormPage.gotoAdd();
    await bookFormPage.fill({czechName, originalName: uniqueName('Book EN'), description: uniqueName('Description'), authors: [author.uuid]});
    await bookFormPage.cancel();

    await bookListPage.expectOpen();
    expect(await bookApi.search(czechName)).toHaveLength(0);
  });

  test('shows main menu and book menu', async ({authedPage}) => {
    const bookListPage = new BookListPage(authedPage);
    await new BookFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(bookListPage.listNavigation).toBeVisible();
    await expect(bookListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const bookFormPage = new BookFormPage(authedPage);
    await bookFormPage.gotoAdd();
    await expect(bookFormPage.authors).toBeVisible();
    await bookFormPage.createButton.click();

    await bookFormPage.expectError('Czech name is required');
    await bookFormPage.expectError('Original name is required');
    await bookFormPage.expectError('Description is required');
    await bookFormPage.expectError('At least 1 author is required');
    await bookFormPage.expectNoError('Note is required');
    await bookFormPage.expectAddOpen();
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const czechName = 'a'.repeat(201);
    const bookFormPage = new BookFormPage(authedPage);
    await bookFormPage.gotoAdd();
    await bookFormPage.create({czechName, originalName: 'b'.repeat(201), description: 'c'.repeat(1001), note: 'd'.repeat(101), authors: [author.uuid]});

    await bookFormPage.expectError('Maximum length of czech name is 200');
    await bookFormPage.expectError('Maximum length of original name is 200');
    await bookFormPage.expectError('Maximum length of description is 1000');
    await bookFormPage.expectError('Maximum length of note is 100');
    await bookFormPage.expectAddOpen();
    expect(await bookApi.search(czechName)).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const czechName = uniqueName('Book CZ');
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoAdd();
      await expect(bookFormPage.authors).toBeVisible();
      await bookFormPage.createButton.click();
      await bookFormPage.expectError('Czech name is required');
      await bookFormPage.create({czechName, originalName: uniqueName('Book EN'), description: uniqueName('Description'), authors: [author.uuid]});

      await bookFormPage.expectNoError('Czech name is required');
      await bookFormPage.expectNoError('At least 1 author is required');
      await bookListPage.expectOpen();
    } finally {
      await bookApi.deleteByCzechName(czechName);
    }
  });

});
