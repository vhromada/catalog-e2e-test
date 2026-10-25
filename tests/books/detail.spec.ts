import { authorApi } from '../../api/resources/AuthorApi';
import { bookApi } from '../../api/resources/BookApi';
import { expect, test } from '../../fixtures/test';
import { BookDetailPage } from '../../pages/books/BookDetailPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorListText, authorRequest, bookRequest, INVALID_UUID } from '../../utils/testData';

test.describe('book detail (/books/:uuid/detail)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/books/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the book from BE', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest({middleName: 'Middle'}));
    const book = await bookApi.create(bookRequest([author.uuid], {note: 'E2E note'}));
    try {
      const bookDetailPage = new BookDetailPage(authedPage);
      await bookDetailPage.goto(book.uuid);

      await bookDetailPage.expectOpen(book.uuid);
      await expect(bookDetailPage.value('Czech name')).toHaveText(book.czechName);
      await expect(bookDetailPage.value('Original name')).toHaveText(book.originalName);
      await expect(bookDetailPage.value('Authors')).toHaveText(authorListText(author));
      await expect(bookDetailPage.value('Description')).toHaveText(book.description);
      await expect(bookDetailPage.value('Count of book items')).toHaveText('0');
      await expect(bookDetailPage.value('Note')).toHaveText('E2E note');
    } finally {
      await bookApi.delete(book.uuid);
      await authorApi.delete(author.uuid);
    }
  });

  test('shows all authors of the book', async ({authedPage}) => {
    const first = await authorApi.create(authorRequest());
    const second = await authorApi.create(authorRequest());
    const book = await bookApi.create(bookRequest([first.uuid, second.uuid]));
    try {
      const bookDetailPage = new BookDetailPage(authedPage);
      await bookDetailPage.goto(book.uuid);

      await expect(bookDetailPage.value('Authors')).toContainText(authorListText(first));
      await expect(bookDetailPage.value('Authors')).toContainText(authorListText(second));
      await expect(bookDetailPage.value('Authors')).toContainText(', ');
    } finally {
      await bookApi.delete(book.uuid);
      await authorApi.delete(first.uuid);
      await authorApi.delete(second.uuid);
    }
  });

  test('does not show the note when the book has none', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookDetailPage = new BookDetailPage(authedPage);
      await bookDetailPage.goto(book.uuid);

      await expect(bookDetailPage.value('Czech name')).toHaveText(book.czechName);
      await expect(bookDetailPage.row('Note')).toHaveCount(0);
    } finally {
      await bookApi.delete(book.uuid);
      await authorApi.delete(author.uuid);
    }
  });

  test('opens book items of the book', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookDetailPage = new BookDetailPage(authedPage);
      await bookDetailPage.goto(book.uuid);
      await bookDetailPage.itemsLink.click();

      await expect(authedPage).toHaveURL(new RegExp(`/books/${book.uuid}/items$`));
    } finally {
      await bookApi.delete(book.uuid);
      await authorApi.delete(author.uuid);
    }
  });

  test('shows main menu and book menu', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await new BookDetailPage(authedPage).goto(book.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(bookListPage.listNavigation).toBeVisible();
      await expect(bookListPage.addNavigation).toBeVisible();
    } finally {
      await bookApi.delete(book.uuid);
      await authorApi.delete(author.uuid);
    }
  });

});
