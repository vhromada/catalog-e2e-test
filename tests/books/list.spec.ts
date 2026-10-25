import { type Author, authorApi } from '../../api/resources/AuthorApi';
import { bookApi } from '../../api/resources/BookApi';
import { expect, test } from '../../fixtures/test';
import { BookDetailPage } from '../../pages/books/BookDetailPage';
import { BookFormPage } from '../../pages/books/BookFormPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorRequest, bookRequest, ITEMS_PER_PAGE, pagesCount, uniqueName } from '../../utils/testData';

test.describe('book list (/books)', () => {

  let author: Author;

  test.beforeEach(async () => {
    author = await authorApi.create(authorRequest());
  });

  test.afterEach(async () => {
    await authorApi.delete(author.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/books');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading, search form and statistics', async ({authedPage}) => {
    const bookListPage = new BookListPage(authedPage);
    await bookListPage.goto();

    await bookListPage.expectOpen();
    await expect(bookListPage.searchCzechName).toBeVisible();
    await expect(bookListPage.searchOriginalName).toBeVisible();
    await expect(bookListPage.searchButton).toBeVisible();
    await expect(bookListPage.count).toHaveText(/\d+/);
    await expect(bookListPage.itemsCount).toHaveText(/\d+/);
  });

  test('shows counts of books and book items from BE', async ({authedPage}) => {
    const bookListPage = new BookListPage(authedPage);

    await expect(async () => {
      const before = await bookApi.statistics();
      await bookListPage.goto();
      await expect(bookListPage.count).toHaveText(/\d+/);
      const shownCount = await bookListPage.count.innerText();
      const shownItemsCount = await bookListPage.itemsCount.innerText();
      const after = await bookApi.statistics();

      expect(after).toEqual(before);
      expect(shownCount).toBe(String(before.count));
      expect(shownItemsCount).toBe(String(before.itemsCount));
    }).toPass();
  });

  test('shows first page of books from BE', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);

      await expect(async () => {
        const before = await bookApi.list(1, ITEMS_PER_PAGE);
        const {count} = await bookApi.statistics();
        await bookListPage.goto();
        await expect(bookListPage.table).toBeVisible();
        const shown = await bookListPage.names.allInnerTexts();
        const pageInfo = await bookListPage.pageInfo.allInnerTexts();
        const after = await bookApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => item.czechName));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('shows books stored in BE', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName});

      await bookListPage.expectRowCount(book.czechName, 1);
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('searches books by czech name', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    const other = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName});

      await bookListPage.expectRowCount(book.czechName, 1);
      await bookListPage.expectRowCount(other.czechName, 0);
    } finally {
      await bookApi.delete(book.uuid);
      await bookApi.delete(other.uuid);
    }
  });

  test('searches books by original name', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    const other = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({originalName: book.originalName});

      await bookListPage.expectRowCount(book.czechName, 1);
      await bookListPage.expectRowCount(other.czechName, 0);
    } finally {
      await bookApi.delete(book.uuid);
      await bookApi.delete(other.uuid);
    }
  });

  test('searches books by czech name and original name', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    const other = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName, originalName: other.originalName});

      await expect(bookListPage.table).toHaveCount(0);
    } finally {
      await bookApi.delete(book.uuid);
      await bookApi.delete(other.uuid);
    }
  });

  test('shows no table when search finds nothing', async ({authedPage}) => {
    const bookListPage = new BookListPage(authedPage);
    await bookListPage.goto();
    await bookListPage.search({czechName: uniqueName('Book CZ')});

    await expect(bookListPage.table).toHaveCount(0);
  });

  test('shows main menu and book menu', async ({authedPage}) => {
    const bookListPage = new BookListPage(authedPage);
    await bookListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(bookListPage.listNavigation).toBeVisible();
    await expect(bookListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const bookListPage = new BookListPage(authedPage);
    await bookListPage.goto();
    await bookListPage.openAdd();

    await new BookFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const bookFormPage = new BookFormPage(authedPage);
    const bookListPage = new BookListPage(authedPage);
    await bookFormPage.gotoAdd();
    await bookListPage.openList();

    await bookListPage.expectOpen();
  });

  test('opens detail of the book', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName});
      await bookListPage.openDetail(book.czechName);

      await new BookDetailPage(authedPage).expectOpen(book.uuid);
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('opens edit form with the book', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid], {note: 'Note'}));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName});
      await bookListPage.edit(book.czechName);

      await new BookFormPage(authedPage).expectEditOpen(book.uuid, {
        czechName: book.czechName,
        originalName: book.originalName,
        description: book.description,
        note: 'Note',
        authors: [author.uuid]
      });
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('duplicates a book', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName});
      await bookListPage.duplicate(book.czechName);

      await bookListPage.expectRowCount(book.czechName, 2);
      const books = await bookApi.search(book.czechName);
      expect(books).toHaveLength(2);
      for (const item of books) {
        expect(item.authors.map((a) => a.uuid)).toEqual([author.uuid]);
      }
    } finally {
      await bookApi.deleteByCzechName(book.czechName);
    }
  });

  test('removes a book', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName});
      await bookListPage.remove(book.czechName);

      await bookListPage.expectRowCount(book.czechName, 0);
      expect(await bookApi.search(book.czechName)).toHaveLength(0);
    } finally {
      await bookApi.deleteByCzechName(book.czechName);
    }
  });

  test('does not show paging for a single page of results', async ({authedPage}) => {
    const book = await bookApi.create(bookRequest([author.uuid]));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: book.czechName});

      await bookListPage.expectRowCount(book.czechName, 1);
      await expect(bookListPage.pageInfo).toHaveCount(0);
    } finally {
      await bookApi.delete(book.uuid);
    }
  });

  test('pages through search results', async ({authedPage}) => {
    const prefix = bookRequest([]).czechName;
    const books = await Promise.all(Array.from({length: 6}, (_, i) => bookApi.create(bookRequest([author.uuid], {czechName: `${prefix} ${i}`}))));
    try {
      const bookListPage = new BookListPage(authedPage);
      await bookListPage.goto();
      await bookListPage.search({czechName: prefix});

      await bookListPage.expectRowCount(prefix, 5);
      await bookListPage.expectPage('1 / 2');
      await expect(bookListPage.first).toHaveCount(0);
      await expect(bookListPage.previous).toHaveCount(0);

      await bookListPage.next.click();
      await bookListPage.expectRowCount(prefix, 1);
      await bookListPage.expectPage('2 / 2');
      await expect(bookListPage.next).toHaveCount(0);
      await expect(bookListPage.last).toHaveCount(0);

      await bookListPage.previous.click();
      await bookListPage.expectRowCount(prefix, 5);
      await bookListPage.expectPage('1 / 2');

      await bookListPage.last.click();
      await bookListPage.expectRowCount(prefix, 1);
      await bookListPage.expectPage('2 / 2');

      await bookListPage.first.click();
      await bookListPage.expectRowCount(prefix, 5);
      await bookListPage.expectPage('1 / 2');
    } finally {
      await Promise.all(books.map((book) => bookApi.delete(book.uuid)));
    }
  });

});
