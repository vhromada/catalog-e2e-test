import { type Author, authorApi } from '../../api/resources/AuthorApi';
import { bookApi } from '../../api/resources/BookApi';
import { expect, test } from '../../fixtures/test';
import { BookFormPage } from '../../pages/books/BookFormPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorRequest, bookRequest, INVALID_UUID, uniqueName } from '../../utils/testData';

test.describe('edit book (/books/:uuid)', () => {

  let author: Author;

  test.beforeEach(async () => {
    author = await authorApi.create(authorRequest());
  });

  test.afterEach(async () => {
    await authorApi.delete(author.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/books/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the book from BE', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid], {note: 'Note'}));
    try {
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);

      await bookFormPage.expectEditOpen(book.uuid, {...book, authors: [author.uuid]});
      await expect(bookFormPage.cancelButton).toBeVisible();
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('prefills the form with a book with more authors and without note', async ({authedPage}) => {
    const second = await authorApi.create(authorRequest());
    const book = await bookApi.create(bookRequest([author.uuid, second.uuid]));
    try {
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);

      await bookFormPage.expectEditOpen(book.uuid, {...book, note: undefined, authors: [author.uuid, second.uuid]});
    } finally {
      await bookApi.delete(book.uuid);
      await authorApi.delete(second.uuid);
    }
  });

  test('updates the book and stores it in BE', async ({authedPage}) => {
    const second = await authorApi.create(authorRequest());
    const book = await bookApi.create(bookRequest([author.uuid]));
    const values = {
      czechName: uniqueName('Book CZ'),
      originalName: uniqueName('Book EN'),
      description: uniqueName('Description'),
      note: 'Changed note',
      authors: [second.uuid]
    };
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName});
      await bookListPage.edit(book.czechName);
      await bookFormPage.expectEditOpen(book.uuid, {...book, note: undefined, authors: [author.uuid]});
      await bookFormPage.update(values);

      await bookListPage.expectOpen();
      await bookListPage.search({czechName: values.czechName});
      await bookListPage.expectRowCount(values.czechName, 1);
      expect(await bookApi.get(book.uuid)).toMatchObject({...values, authors: [second]});
    } finally {
      await bookApi.delete(book.uuid);
      await authorApi.delete(second.uuid);
    }
  });

  test('updates the authors of the book', async ({authedPage}) => {
    const second = await authorApi.create(authorRequest());
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);
      await bookFormPage.expectEditOpen(book.uuid, {...book, note: undefined, authors: [author.uuid]});
      await bookFormPage.authors.selectOption([author.uuid, second.uuid]);
      await bookFormPage.updateButton.click();

      await bookListPage.expectOpen();
      const updated = await bookApi.get(book.uuid);
      expect(updated.authors.map((item) => item.uuid).sort()).toEqual([author.uuid, second.uuid].sort());
    } finally {
      await bookApi.delete(book.uuid);
      await authorApi.delete(second.uuid);
    }
  });

  test('clears the note', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid], {note: 'Note'}));
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);
      await bookFormPage.expectEditOpen(book.uuid, {...book, authors: [author.uuid]});
      await bookFormPage.note.fill('');
      await bookFormPage.updateButton.click();

      await bookListPage.expectOpen();
      expect((await bookApi.get(book.uuid)).note ?? null).toBeNull();
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('updates the book with the maximum field values', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
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
      await bookFormPage.gotoEdit(book.uuid);
      await bookFormPage.expectEditOpen(book.uuid, {...book, note: undefined, authors: [author.uuid]});
      await bookFormPage.update(values);

      await bookListPage.expectOpen();
      expect(await bookApi.get(book.uuid)).toMatchObject({...values, authors: [author]});
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('saving without changes keeps the book unchanged', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid], {note: 'Note'}));
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);
      await bookFormPage.expectEditOpen(book.uuid, {...book, authors: [author.uuid]});
      await bookFormPage.updateButton.click();

      await bookListPage.expectOpen();
      expect(await bookApi.get(book.uuid)).toEqual(book);
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);
      await bookFormPage.expectEditOpen(book.uuid, {...book, note: undefined, authors: [author.uuid]});
      await bookFormPage.czechName.fill(uniqueName('Book CZ'));
      await bookFormPage.cancel();

      await bookListPage.expectOpen();
      expect(await bookApi.get(book.uuid)).toEqual(book);
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('shows main menu and book menu', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await new BookFormPage(authedPage).gotoEdit(book.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(bookListPage.listNavigation).toBeVisible();
      await expect(bookListPage.addNavigation).toBeVisible();
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);
      await bookFormPage.expectEditOpen(book.uuid, {...book, note: undefined, authors: [author.uuid]});
      await bookFormPage.update({czechName: '', originalName: '', description: '', authors: []});

      await bookFormPage.expectError('Czech name is required');
      await bookFormPage.expectError('Original name is required');
      await bookFormPage.expectError('Description is required');
      await bookFormPage.expectError('At least 1 author is required');
      await bookFormPage.expectNoError('Note is required');
      await bookFormPage.expectEditOpen(book.uuid, {czechName: '', originalName: '', description: '', authors: []});
      expect(await bookApi.get(book.uuid)).toEqual(book);
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);
      await bookFormPage.expectEditOpen(book.uuid, {...book, note: undefined, authors: [author.uuid]});
      const values = {czechName: 'a'.repeat(201), originalName: 'b'.repeat(201), description: 'c'.repeat(1001), note: 'd'.repeat(101), authors: [author.uuid]};
      await bookFormPage.update(values);

      await bookFormPage.expectError('Maximum length of czech name is 200');
      await bookFormPage.expectError('Maximum length of original name is 200');
      await bookFormPage.expectError('Maximum length of description is 1000');
      await bookFormPage.expectError('Maximum length of note is 100');
      await bookFormPage.expectEditOpen(book.uuid, values);
      expect(await bookApi.get(book.uuid)).toEqual(book);
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    const czechName = uniqueName('Book CZ');
    try {
      const bookListPage = new BookListPage(authedPage);
      const bookFormPage = new BookFormPage(authedPage);
      await bookFormPage.gotoEdit(book.uuid);
      await bookFormPage.expectEditOpen(book.uuid, {...book, note: undefined, authors: [author.uuid]});
      await bookFormPage.update({czechName: '', originalName: '', description: '', authors: []});
      await bookFormPage.expectError('Czech name is required');
      await bookFormPage.expectError('At least 1 author is required');
      await bookFormPage.update({czechName, originalName: book.originalName, description: book.description, authors: [author.uuid]});

      await bookFormPage.expectNoError('Czech name is required');
      await bookFormPage.expectNoError('At least 1 author is required');
      await bookListPage.expectOpen();
      expect((await bookApi.get(book.uuid)).czechName).toBe(czechName);
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

});
