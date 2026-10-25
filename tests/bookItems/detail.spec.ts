import { type Author, authorApi } from '../../api/resources/AuthorApi';
import { type Book, bookApi } from '../../api/resources/BookApi';
import { bookItemApi } from '../../api/resources/BookItemApi';
import { expect, test } from '../../fixtures/test';
import { BookItemDetailPage } from '../../pages/bookItems/BookItemDetailPage';
import { BookItemListPage } from '../../pages/bookItems/BookItemListPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorRequest, bookItemRequest, bookRequest, INVALID_UUID } from '../../utils/testData';

test.describe('book item detail (/books/:book/items/:uuid/detail)', () => {

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
    await page.goto(`/books/${INVALID_UUID}/items/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the book item from BE', async ({authedPage}) => {
    const bookItem = await bookItemApi.create(book.uuid, bookItemRequest({languages: ['CZ', 'EN'], format: 'PDF', note: 'Note'}));
    const bookItemDetailPage = new BookItemDetailPage(authedPage);
    await bookItemDetailPage.goto(book.uuid, bookItem.uuid);

    await bookItemDetailPage.expectOpen(book.uuid, bookItem.uuid);
    await expect(bookItemDetailPage.value('Languages')).toHaveText(/^(Czech, English|English, Czech)$/);
    await expect(bookItemDetailPage.value('Format')).toHaveText('Electronic - pdf');
    await expect(bookItemDetailPage.value('Note')).toHaveText('Note');
  });

  test('hides the note when it is not set', async ({authedPage}) => {
    const bookItem = await bookItemApi.create(book.uuid, bookItemRequest({languages: ['SK'], format: 'PAPER'}));
    const bookItemDetailPage = new BookItemDetailPage(authedPage);
    await bookItemDetailPage.goto(book.uuid, bookItem.uuid);

    await expect(bookItemDetailPage.value('Languages')).toHaveText('Slovak');
    await expect(bookItemDetailPage.value('Format')).toHaveText('Paper');
    await expect(bookItemDetailPage.row('Note')).toHaveCount(0);
  });

  test('shows main menu, book menu and book item menu', async ({authedPage}) => {
    const bookItem = await bookItemApi.create(book.uuid, bookItemRequest());
    const bookListPage = new BookListPage(authedPage);
    const bookItemListPage = new BookItemListPage(authedPage);
    await new BookItemDetailPage(authedPage).goto(book.uuid, bookItem.uuid);

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(bookListPage.listNavigation).toBeVisible();
    await expect(bookListPage.addNavigation).toBeVisible();
    await expect(bookItemListPage.listNavigation).toBeVisible();
    await expect(bookItemListPage.addNavigation).toBeVisible();
  });

});
