import { authorApi } from '../../api/resources/AuthorApi';
import { expect, test } from '../../fixtures/test';
import { AuthorFormPage } from '../../pages/authors/AuthorFormPage';
import { AuthorListPage } from '../../pages/authors/AuthorListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { authorListText, authorRequest, ITEMS_PER_PAGE, pagesCount, uniqueName } from '../../utils/testData';

test.describe('author list (/authors)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/authors');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading, search form and statistics', async ({authedPage}) => {
    const authorListPage = new AuthorListPage(authedPage);
    await authorListPage.goto();

    await authorListPage.expectOpen();
    await expect(authorListPage.searchFirstName).toBeVisible();
    await expect(authorListPage.searchMiddleName).toBeVisible();
    await expect(authorListPage.searchLastName).toBeVisible();
    await expect(authorListPage.searchButton).toBeVisible();
    await expect(authorListPage.count).toHaveText(/\d+/);
  });

  test('shows count of authors from BE', async ({authedPage}) => {
    const authorListPage = new AuthorListPage(authedPage);

    await expect(async () => {
      const before = await authorApi.statistics();
      await authorListPage.goto();
      await expect(authorListPage.count).toHaveText(/\d+/);
      const shown = await authorListPage.count.innerText();
      const after = await authorApi.statistics();

      expect(after.count).toBe(before.count);
      expect(shown).toBe(String(before.count));
    }).toPass();
  });

  test('shows first page of authors from BE', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    try {
      const authorListPage = new AuthorListPage(authedPage);

      await expect(async () => {
        const before = await authorApi.list(1, ITEMS_PER_PAGE);
        const {count} = await authorApi.statistics();
        await authorListPage.goto();
        await expect(authorListPage.table).toBeVisible();
        const shown = await authorListPage.names.allInnerTexts();
        const pageInfo = await authorListPage.pageInfo.allInnerTexts();
        const after = await authorApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => authorListText(item)));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('shows authors stored in BE with and without middle name', async ({authedPage}) => {
    const lastName = uniqueName('Author');
    const withMiddle = await authorApi.create(authorRequest({middleName: 'Middle', lastName}));
    const withoutMiddle = await authorApi.create(authorRequest({lastName}));
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({lastName});

      await authorListPage.expectRowCount(authorListText(withMiddle), 1);
      await authorListPage.expectRowCount(authorListText(withoutMiddle), 1);
    } finally {
      await authorApi.deleteByLastName(lastName);
    }
  });

  test('searches authors by first name', async ({authedPage}) => {
    const firstName = uniqueName('First');
    const author = await authorApi.create(authorRequest({firstName}));
    const other = await authorApi.create(authorRequest());
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({firstName});

      await authorListPage.expectRowCount(author.lastName, 1);
      await authorListPage.expectRowCount(other.lastName, 0);
    } finally {
      await authorApi.delete(author.uuid);
      await authorApi.delete(other.uuid);
    }
  });

  test('searches authors by middle name', async ({authedPage}) => {
    const middleName = uniqueName('Middle');
    const author = await authorApi.create(authorRequest({middleName}));
    const other = await authorApi.create(authorRequest({middleName: uniqueName('Middle')}));
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({middleName});

      await authorListPage.expectRowCount(author.lastName, 1);
      await authorListPage.expectRowCount(other.lastName, 0);
    } finally {
      await authorApi.delete(author.uuid);
      await authorApi.delete(other.uuid);
    }
  });

  test('searches authors by last name', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    const other = await authorApi.create(authorRequest());
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({lastName: author.lastName});

      await authorListPage.expectRowCount(author.lastName, 1);
      await authorListPage.expectRowCount(other.lastName, 0);
    } finally {
      await authorApi.delete(author.uuid);
      await authorApi.delete(other.uuid);
    }
  });

  test('searches authors by a combination of names', async ({authedPage}) => {
    const lastName = uniqueName('Author');
    const author = await authorApi.create(authorRequest({firstName: 'Alpha', lastName}));
    const other = await authorApi.create(authorRequest({firstName: 'Beta', lastName}));
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({firstName: 'Alpha', lastName});

      await authorListPage.expectRowCount(authorListText(author), 1);
      await authorListPage.expectRowCount(authorListText(other), 0);
    } finally {
      await authorApi.deleteByLastName(lastName);
    }
  });

  test('shows no table when search finds nothing', async ({authedPage}) => {
    const authorListPage = new AuthorListPage(authedPage);
    await authorListPage.goto();
    await authorListPage.search({lastName: authorRequest().lastName});

    await expect(authorListPage.table).toHaveCount(0);
  });

  test('shows main menu and author menu', async ({authedPage}) => {
    const authorListPage = new AuthorListPage(authedPage);
    await authorListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(authorListPage.listNavigation).toBeVisible();
    await expect(authorListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const authorListPage = new AuthorListPage(authedPage);
    await authorListPage.goto();
    await authorListPage.openAdd();

    await new AuthorFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const authorFormPage = new AuthorFormPage(authedPage);
    const authorListPage = new AuthorListPage(authedPage);
    await authorFormPage.gotoAdd();
    await authorListPage.openList();

    await authorListPage.expectOpen();
  });

  test('opens edit form with the author', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest({middleName: 'Middle'}));
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({lastName: author.lastName});
      await authorListPage.edit(author.lastName);

      await new AuthorFormPage(authedPage).expectEditOpen(author.uuid, {firstName: author.firstName, middleName: 'Middle', lastName: author.lastName});
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('duplicates an author', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({lastName: author.lastName});
      await authorListPage.duplicate(author.lastName);

      await authorListPage.expectRowCount(author.lastName, 2);
      expect(await authorApi.search({lastName: author.lastName})).toHaveLength(2);
    } finally {
      await authorApi.deleteByLastName(author.lastName);
    }
  });

  test('removes an author', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({lastName: author.lastName});
      await authorListPage.remove(author.lastName);

      await authorListPage.expectRowCount(author.lastName, 0);
      expect(await authorApi.search({lastName: author.lastName})).toHaveLength(0);
    } finally {
      await authorApi.deleteByLastName(author.lastName);
    }
  });

  test('does not show paging for a single page of results', async ({authedPage}) => {
    const author = await authorApi.create(authorRequest());
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({lastName: author.lastName});

      await authorListPage.expectRowCount(author.lastName, 1);
      await expect(authorListPage.pageInfo).toHaveCount(0);
    } finally {
      await authorApi.delete(author.uuid);
    }
  });

  test('pages through search results', async ({authedPage}) => {
    const prefix = authorRequest().lastName;
    const authors = await Promise.all(Array.from({length: 6}, (_, i) => authorApi.create(authorRequest({lastName: `${prefix} ${i}`}))));
    try {
      const authorListPage = new AuthorListPage(authedPage);
      await authorListPage.goto();
      await authorListPage.search({lastName: prefix});

      await authorListPage.expectRowCount(prefix, 5);
      await authorListPage.expectPage('1 / 2');
      await expect(authorListPage.first).toHaveCount(0);
      await expect(authorListPage.previous).toHaveCount(0);

      await authorListPage.next.click();
      await authorListPage.expectRowCount(prefix, 1);
      await authorListPage.expectPage('2 / 2');
      await expect(authorListPage.next).toHaveCount(0);
      await expect(authorListPage.last).toHaveCount(0);

      await authorListPage.previous.click();
      await authorListPage.expectRowCount(prefix, 5);
      await authorListPage.expectPage('1 / 2');

      await authorListPage.last.click();
      await authorListPage.expectRowCount(prefix, 1);
      await authorListPage.expectPage('2 / 2');

      await authorListPage.first.click();
      await authorListPage.expectRowCount(prefix, 5);
      await authorListPage.expectPage('1 / 2');
    } finally {
      await Promise.all(authors.map((author) => authorApi.delete(author.uuid)));
    }
  });

});
