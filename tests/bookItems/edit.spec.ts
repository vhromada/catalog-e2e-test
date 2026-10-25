import { type Author, authorApi } from '../../api/resources/AuthorApi';
import { type Book, bookApi } from '../../api/resources/BookApi';
import { type BookItem, bookItemApi } from '../../api/resources/BookItemApi';
import { expect, test } from '../../fixtures/test';
import { BookItemFormPage } from '../../pages/bookItems/BookItemFormPage';
import { BookItemListPage } from '../../pages/bookItems/BookItemListPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorRequest, bookItemRequest, bookRequest, INVALID_UUID } from '../../utils/testData';

test.describe('edit book item (/books/:book/items/:uuid)', () => {

  const values = {languages: ['CZ'], format: 'PDF', note: 'Note'};
  let author: Author;
  let book: Book;
  let bookItem: BookItem;

  test.beforeEach(async () => {
    author = await authorApi.create(authorRequest());
    book = await bookApi.create(bookRequest([author.uuid]));
    bookItem = await bookItemApi.create(book.uuid, bookItemRequest(values));
  });

  test.afterEach(async () => {
    await bookApi.delete(book.uuid);
    await authorApi.delete(author.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/books/${INVALID_UUID}/items/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the book item from BE', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoEdit(book.uuid, bookItem.uuid);

    await bookItemFormPage.expectEditOpen(book.uuid, bookItem.uuid, values);
    await expect(bookItemFormPage.cancelButton).toBeVisible();
  });

  test('updates the book item and stores it in BE', async ({authedPage}) => {
    const bookItemListPage = new BookItemListPage(authedPage);
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemListPage.goto(book.uuid);
    await bookItemListPage.edit('Electronic - pdf');
    await bookItemFormPage.expectEditOpen(book.uuid, bookItem.uuid, values);
    await bookItemFormPage.update({languages: ['EN', 'JP'], format: 'TXT', note: 'New note'});

    await bookItemListPage.expectOpen(book.uuid);
    await bookItemListPage.expectRowCount('Electronic - txt', 1);
    const updated = await bookItemApi.get(book.uuid, bookItem.uuid);
    expect(updated).toMatchObject({uuid: bookItem.uuid, format: 'TXT', note: 'New note'});
    expect([...updated.languages].sort()).toEqual(['EN', 'JP']);
  });

  test('clears the note', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoEdit(book.uuid, bookItem.uuid);
    await bookItemFormPage.expectEditOpen(book.uuid, bookItem.uuid, values);
    await bookItemFormPage.update({languages: ['CZ'], format: 'PDF'});

    await new BookItemListPage(authedPage).expectOpen(book.uuid);
    expect((await bookItemApi.get(book.uuid, bookItem.uuid)).note).toBeFalsy();
  });

  test('saving without changes keeps the book item unchanged', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoEdit(book.uuid, bookItem.uuid);
    await bookItemFormPage.expectEditOpen(book.uuid, bookItem.uuid, values);
    await bookItemFormPage.updateButton.click();

    await new BookItemListPage(authedPage).expectOpen(book.uuid);
    expect(await bookItemApi.get(book.uuid, bookItem.uuid)).toEqual(bookItem);
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoEdit(book.uuid, bookItem.uuid);
    await bookItemFormPage.expectEditOpen(book.uuid, bookItem.uuid, values);
    await bookItemFormPage.format('PAPER').check();
    await bookItemFormPage.cancel();

    await new BookItemListPage(authedPage).expectOpen(book.uuid);
    expect(await bookItemApi.get(book.uuid, bookItem.uuid)).toEqual(bookItem);
  });

  test('shows main menu, book menu and book item menu', async ({authedPage}) => {
    const bookListPage = new BookListPage(authedPage);
    const bookItemListPage = new BookItemListPage(authedPage);
    await new BookItemFormPage(authedPage).gotoEdit(book.uuid, bookItem.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(bookListPage.listNavigation).toBeVisible();
    await expect(bookListPage.addNavigation).toBeVisible();
    await expect(bookItemListPage.listNavigation).toBeVisible();
    await expect(bookItemListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoEdit(book.uuid, bookItem.uuid);
    await bookItemFormPage.expectEditOpen(book.uuid, bookItem.uuid, values);
    await bookItemFormPage.update({languages: [], format: 'PDF', note: 'Note'});

    await bookItemFormPage.expectError('At least 1 language is required');
    expect(await bookItemApi.get(book.uuid, bookItem.uuid)).toEqual(bookItem);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoEdit(book.uuid, bookItem.uuid);
    await bookItemFormPage.expectEditOpen(book.uuid, bookItem.uuid, values);
    await bookItemFormPage.update({languages: ['CZ'], format: 'PDF', note: 'b'.repeat(101)});

    await bookItemFormPage.expectError('Maximum length of note is 100');
    expect(await bookItemApi.get(book.uuid, bookItem.uuid)).toEqual(bookItem);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoEdit(book.uuid, bookItem.uuid);
    await bookItemFormPage.expectEditOpen(book.uuid, bookItem.uuid, values);
    await bookItemFormPage.update({languages: [], format: 'PDF', note: 'Note'});
    await bookItemFormPage.expectError('At least 1 language is required');
    await bookItemFormPage.update({languages: ['FR'], format: 'PDF', note: 'Note'});

    await bookItemFormPage.expectNoError('At least 1 language is required');
    await new BookItemListPage(authedPage).expectOpen(book.uuid);
    expect((await bookItemApi.get(book.uuid, bookItem.uuid)).languages).toEqual(['FR']);
  });

});
