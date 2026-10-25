import { type Author, authorApi } from '../../api/resources/AuthorApi';
import { type Book, bookApi } from '../../api/resources/BookApi';
import { bookItemApi } from '../../api/resources/BookItemApi';
import { expect, test } from '../../fixtures/test';
import { BookItemFormPage } from '../../pages/bookItems/BookItemFormPage';
import { BookItemListPage } from '../../pages/bookItems/BookItemListPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorRequest, bookRequest, INVALID_UUID } from '../../utils/testData';

test.describe('add book item (/books/:book/items/add)', () => {

  let author: Author;
  let book: Book;

  test.beforeEach(async () => {
    author = await authorApi.create(authorRequest());
    book = await bookApi.create(bookRequest([author.uuid]));
  });

  test.afterEach(async () => {
    await bookApi.delete(book.uuid);
    await authorApi.delete(author.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/books/${INVALID_UUID}/items/add`);

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoAdd(book.uuid);

    await bookItemFormPage.expectAddOpen(book.uuid);
    await expect(bookItemFormPage.language('CZ')).toBeVisible();
    await expect(bookItemFormPage.format('PAPER')).toBeVisible();
    await expect(bookItemFormPage.languages).toHaveCount(5);
    await expect(bookItemFormPage.formats).toHaveCount(4);
    expect(await bookItemFormPage.languages.evaluateAll((inputs: HTMLInputElement[]) => inputs.some((input) => input.checked))).toBe(false);
    expect(await bookItemFormPage.formats.evaluateAll((inputs: HTMLInputElement[]) => inputs.some((input) => input.checked))).toBe(false);
    await expect(bookItemFormPage.note).toHaveValue('');
    await expect(bookItemFormPage.cancelButton).toBeVisible();
  });

  test('adds a book item and stores it in BE', async ({authedPage}) => {
    const bookItemListPage = new BookItemListPage(authedPage);
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemListPage.goto(book.uuid);
    await bookItemListPage.openAdd();
    await bookItemFormPage.expectAddOpen(book.uuid);
    await bookItemFormPage.create({languages: ['CZ', 'EN'], format: 'PDF', note: 'Note'});

    await bookItemListPage.expectOpen(book.uuid);
    await bookItemListPage.expectRowCount('Electronic - pdf', 1);
    const bookItems = (await bookItemApi.list(book.uuid)).data;
    expect(bookItems).toHaveLength(1);
    expect(bookItems[0]).toMatchObject({format: 'PDF', note: 'Note'});
    expect([...bookItems[0].languages].sort()).toEqual(['CZ', 'EN']);
    expect((await bookApi.get(book.uuid)).itemsCount).toBe(1);
  });

  test('adds a book item with only the required fields', async ({authedPage}) => {
    const bookItemListPage = new BookItemListPage(authedPage);
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoAdd(book.uuid);
    await bookItemFormPage.create({languages: ['SK'], format: 'PAPER'});

    await bookItemListPage.expectOpen(book.uuid);
    const bookItems = (await bookItemApi.list(book.uuid)).data;
    expect(bookItems).toHaveLength(1);
    expect(bookItems[0]).toMatchObject({languages: ['SK'], format: 'PAPER'});
    expect(bookItems[0].note).toBeFalsy();
  });

  test('adds a book item with all the languages and the maximum note', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoAdd(book.uuid);
    await bookItemFormPage.create({languages: ['CZ', 'EN', 'FR', 'JP', 'SK'], format: 'TXT', note: 'b'.repeat(100)});

    await new BookItemListPage(authedPage).expectOpen(book.uuid);
    const bookItems = (await bookItemApi.list(book.uuid)).data;
    expect(bookItems).toHaveLength(1);
    expect(bookItems[0]).toMatchObject({format: 'TXT', note: 'b'.repeat(100)});
    expect([...bookItems[0].languages].sort()).toEqual(['CZ', 'EN', 'FR', 'JP', 'SK']);
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoAdd(book.uuid);
    await bookItemFormPage.language('CZ').check();
    await bookItemFormPage.format('PAPER').check();
    await bookItemFormPage.cancel();

    await new BookItemListPage(authedPage).expectOpen(book.uuid);
    expect((await bookItemApi.list(book.uuid)).data).toHaveLength(0);
  });

  test('shows main menu, book menu and book item menu', async ({authedPage}) => {
    const bookListPage = new BookListPage(authedPage);
    const bookItemListPage = new BookItemListPage(authedPage);
    await new BookItemFormPage(authedPage).gotoAdd(book.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(bookListPage.listNavigation).toBeVisible();
    await expect(bookListPage.addNavigation).toBeVisible();
    await expect(bookItemListPage.listNavigation).toBeVisible();
    await expect(bookItemListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoAdd(book.uuid);
    await bookItemFormPage.createButton.click();

    await bookItemFormPage.expectError('At least 1 language is required');
    await bookItemFormPage.expectError('Format is required');
    await bookItemFormPage.expectNoError('Note is required');
    await bookItemFormPage.expectAddOpen(book.uuid);
    expect((await bookItemApi.list(book.uuid)).data).toHaveLength(0);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoAdd(book.uuid);
    await bookItemFormPage.create({languages: ['EN'], format: 'PAPER', note: 'b'.repeat(101)});

    await bookItemFormPage.expectError('Maximum length of note is 100');
    await bookItemFormPage.expectAddOpen(book.uuid);
    expect((await bookItemApi.list(book.uuid)).data).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const bookItemFormPage = new BookItemFormPage(authedPage);
    await bookItemFormPage.gotoAdd(book.uuid);
    await bookItemFormPage.createButton.click();
    await bookItemFormPage.expectError('At least 1 language is required');
    await bookItemFormPage.expectError('Format is required');
    await bookItemFormPage.create({languages: ['EN'], format: 'DOC'});

    await bookItemFormPage.expectNoError('At least 1 language is required');
    await bookItemFormPage.expectNoError('Format is required');
    await new BookItemListPage(authedPage).expectOpen(book.uuid);
    expect((await bookItemApi.list(book.uuid)).data).toHaveLength(1);
  });

});
