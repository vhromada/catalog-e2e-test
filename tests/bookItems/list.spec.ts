import { type Author, authorApi } from '../../api/resources/AuthorApi';
import { type Book, bookApi } from '../../api/resources/BookApi';
import { bookItemApi } from '../../api/resources/BookItemApi';
import { expect, test } from '../../fixtures/test';
import { BookItemDetailPage } from '../../pages/bookItems/BookItemDetailPage';
import { BookItemFormPage } from '../../pages/bookItems/BookItemFormPage';
import { BookItemListPage } from '../../pages/bookItems/BookItemListPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorRequest, bookItemRequest, bookRequest, INVALID_UUID, ITEMS_PER_PAGE } from '../../utils/testData';

test.describe('book item list (/books/:book/items)', () => {

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
    await page.goto(`/books/${INVALID_UUID}/items`);

    await new LoginPage(page).expectOpen();
  });

  test('shows heading', async ({authedPage}) => {
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);

    await bookItemListPage.expectOpen(book.uuid);
  });

  test('shows book items from BE', async ({authedPage}) => {
    await bookItemApi.create(book.uuid, bookItemRequest({format: 'PAPER'}));
    await bookItemApi.create(book.uuid, bookItemRequest({format: 'PDF'}));
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);

    await expect(bookItemListPage.formats).toHaveText(['Paper', 'Electronic - pdf']);
    await expect(bookItemListPage.pageInfo).toHaveCount(0);
    await expect(bookItemListPage.noData).toHaveCount(0);
  });

  test('shows no table and no data message for book without items', async ({authedPage}) => {
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);

    await bookItemListPage.expectOpen(book.uuid);
    await expect(bookItemListPage.table).toHaveCount(0);
    await expect(bookItemListPage.noData).toHaveText('No book items');
  });

  test('shows main menu, book menu and book item menu', async ({authedPage}) => {
    const bookItemListPage = new BookItemListPage(authedPage);
    const bookListPage = new BookListPage(authedPage);
    await bookItemListPage.goto(book.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(bookListPage.listNavigation).toBeVisible();
    await expect(bookListPage.addNavigation).toBeVisible();
    await expect(bookItemListPage.listNavigation).toBeVisible();
    await expect(bookItemListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);
    await bookItemListPage.openAdd();

    await new BookItemFormPage(authedPage).expectAddOpen(book.uuid);
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const bookItemListPage = new BookItemListPage(authedPage);
    await new BookItemFormPage(authedPage).gotoAdd(book.uuid);
    await bookItemListPage.openList();

    await bookItemListPage.expectOpen(book.uuid);
  });

  test('opens detail of the book item', async ({authedPage}) => {
    const bookItem = await bookItemApi.create(book.uuid, bookItemRequest({format: 'PDF'}));
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);
    await bookItemListPage.openDetail('Electronic - pdf');

    await new BookItemDetailPage(authedPage).expectOpen(book.uuid, bookItem.uuid);
  });

  test('opens edit form with the book item', async ({authedPage}) => {
    const bookItem = await bookItemApi.create(book.uuid, bookItemRequest({languages: ['CZ'], format: 'DOC', note: 'Note'}));
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);
    await bookItemListPage.edit('Electronic - doc');

    await new BookItemFormPage(authedPage).expectEditOpen(book.uuid, bookItem.uuid, {languages: ['CZ'], format: 'DOC', note: 'Note'});
  });

  test('duplicates a book item', async ({authedPage}) => {
    await bookItemApi.create(book.uuid, bookItemRequest({languages: ['CZ', 'EN'], format: 'PDF', note: 'Note'}));
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);
    await bookItemListPage.duplicate('Electronic - pdf');

    await bookItemListPage.expectRowCount('Electronic - pdf', 2);
    const bookItems = (await bookItemApi.list(book.uuid)).data;
    expect(bookItems).toHaveLength(2);
    for (const item of bookItems) {
      expect(item).toMatchObject({format: 'PDF', note: 'Note'});
      expect([...item.languages].sort()).toEqual(['CZ', 'EN']);
    }
    expect((await bookApi.get(book.uuid)).itemsCount).toBe(2);
  });

  test('removes a book item', async ({authedPage}) => {
    await bookItemApi.create(book.uuid, bookItemRequest());
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);
    await bookItemListPage.remove('Paper');

    await bookItemListPage.expectRowCount('Paper', 0);
    expect((await bookItemApi.list(book.uuid)).data).toHaveLength(0);
    expect((await bookApi.get(book.uuid)).itemsCount).toBe(0);
  });

  test('pages through the book items', async ({authedPage}) => {
    for (let i = 0; i <= ITEMS_PER_PAGE; i++) {
      await bookItemApi.create(book.uuid, bookItemRequest());
    }
    const bookItemListPage = new BookItemListPage(authedPage);
    await bookItemListPage.goto(book.uuid);

    await expect(bookItemListPage.formats).toHaveCount(ITEMS_PER_PAGE);
    await bookItemListPage.expectPage('1 / 2');
    await expect(bookItemListPage.first).toHaveCount(0);
    await expect(bookItemListPage.previous).toHaveCount(0);

    await bookItemListPage.next.click();
    await expect(bookItemListPage.formats).toHaveCount(1);
    await bookItemListPage.expectPage('2 / 2');
    await expect(bookItemListPage.next).toHaveCount(0);
    await expect(bookItemListPage.last).toHaveCount(0);

    await bookItemListPage.previous.click();
    await expect(bookItemListPage.formats).toHaveCount(ITEMS_PER_PAGE);
    await bookItemListPage.expectPage('1 / 2');

    await bookItemListPage.last.click();
    await expect(bookItemListPage.formats).toHaveCount(1);
    await bookItemListPage.expectPage('2 / 2');

    await bookItemListPage.first.click();
    await expect(bookItemListPage.formats).toHaveCount(ITEMS_PER_PAGE);
    await bookItemListPage.expectPage('1 / 2');
  });

});
