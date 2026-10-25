import { programApi } from '../../api/resources/ProgramApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { ProgramDetailPage } from '../../pages/programs/ProgramDetailPage';
import { ProgramFormPage } from '../../pages/programs/ProgramFormPage';
import { ProgramListPage } from '../../pages/programs/ProgramListPage';
import { ITEMS_PER_PAGE, pagesCount, programRequest } from '../../utils/testData';

test.describe('program list (/programs)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/programs');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading, search form and statistics', async ({authedPage}) => {
    const programListPage = new ProgramListPage(authedPage);
    await programListPage.goto();

    await programListPage.expectOpen();
    await expect(programListPage.searchName).toBeVisible();
    await expect(programListPage.searchButton).toBeVisible();
    await expect(programListPage.count).toHaveText(/\d+/);
    await expect(programListPage.mediaCount).toHaveText(/\d+/);
  });

  // The DB is shared with tests running in parallel, so the BE data is compared only when it did not change while the FE was loading.
  test('shows counts of programs and media from BE', async ({authedPage}) => {
    const programListPage = new ProgramListPage(authedPage);

    await expect(async () => {
      const before = await programApi.statistics();
      await programListPage.goto();
      await expect(programListPage.count).toHaveText(/\d+/);
      const shownCount = await programListPage.count.innerText();
      const shownMediaCount = await programListPage.mediaCount.innerText();
      const after = await programApi.statistics();

      expect(after).toEqual(before);
      expect(shownCount).toBe(String(before.count));
      expect(shownMediaCount).toBe(String(before.mediaCount));
    }).toPass();
  });

  test('shows first page of programs from BE', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);

      await expect(async () => {
        const before = await programApi.list(1, ITEMS_PER_PAGE);
        const {count} = await programApi.statistics();
        await programListPage.goto();
        await expect(programListPage.table).toBeVisible();
        const shown = await programListPage.names.allInnerTexts();
        const pageInfo = await programListPage.pageInfo.allInnerTexts();
        const after = await programApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data.map((item) => item.name));
        expect(pageInfo).toEqual(pagesCount(count) > 1 ? [`1 / ${pagesCount(count)}`] : []);
      }).toPass();
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('shows programs stored in BE', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);
      await programListPage.goto();
      await programListPage.search(program.name);

      await programListPage.expectRowCount(program.name, 1);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('searches programs by name', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    const other = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);
      await programListPage.goto();
      await programListPage.search(program.name);

      await programListPage.expectRowCount(program.name, 1);
      await programListPage.expectRowCount(other.name, 0);
    } finally {
      await programApi.delete(program.uuid);
      await programApi.delete(other.uuid);
    }
  });

  test('shows no table when search finds nothing', async ({authedPage}) => {
    const programListPage = new ProgramListPage(authedPage);
    await programListPage.goto();
    await programListPage.search(programRequest().name);

    await expect(programListPage.table).toHaveCount(0);
  });

  test('shows main menu and program menu', async ({authedPage}) => {
    const programListPage = new ProgramListPage(authedPage);
    await programListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(programListPage.listNavigation).toBeVisible();
    await expect(programListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const programListPage = new ProgramListPage(authedPage);
    await programListPage.goto();
    await programListPage.openAdd();

    await new ProgramFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const programFormPage = new ProgramFormPage(authedPage);
    const programListPage = new ProgramListPage(authedPage);
    await programFormPage.gotoAdd();
    await programListPage.openList();

    await programListPage.expectOpen();
  });

  test('opens detail of the program', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);
      await programListPage.goto();
      await programListPage.search(program.name);
      await programListPage.openDetail(program.name);

      await new ProgramDetailPage(authedPage).expectOpen(program.uuid);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('opens edit form with the program', async ({authedPage}) => {
    const program = await programApi.create(programRequest({
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      mediaCount: 3,
      format: 'BINARY',
      crack: true,
      serialKey: true,
      otherData: 'Other data',
      note: 'Note'
    }));
    try {
      const programListPage = new ProgramListPage(authedPage);
      await programListPage.goto();
      await programListPage.search(program.name);
      await programListPage.edit(program.name);

      await new ProgramFormPage(authedPage).expectEditOpen(program.uuid, {
        name: program.name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 3,
        format: 'BINARY',
        crack: true,
        serialKey: true,
        otherData: 'Other data',
        note: 'Note'
      });
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('duplicates a program', async ({authedPage}) => {
    const program = await programApi.create(programRequest({mediaCount: 2, format: 'STEAM', crack: true, note: 'Note'}));
    try {
      const programListPage = new ProgramListPage(authedPage);
      await programListPage.goto();
      await programListPage.search(program.name);
      await programListPage.duplicate(program.name);

      await programListPage.expectRowCount(program.name, 2);
      const programs = await programApi.search(program.name);
      expect(programs).toHaveLength(2);
      for (const item of programs) {
        expect(item).toMatchObject({name: program.name, mediaCount: 2, format: 'STEAM', crack: true, serialKey: false, note: 'Note'});
      }
    } finally {
      await programApi.deleteByName(program.name);
    }
  });

  test('removes a program', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);
      await programListPage.goto();
      await programListPage.search(program.name);
      await programListPage.remove(program.name);

      await programListPage.expectRowCount(program.name, 0);
      expect(await programApi.search(program.name)).toHaveLength(0);
    } finally {
      await programApi.deleteByName(program.name);
    }
  });

  test('does not show paging for a single page of results', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);
      await programListPage.goto();
      await programListPage.search(program.name);

      await programListPage.expectRowCount(program.name, 1);
      await expect(programListPage.pageInfo).toHaveCount(0);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('pages through search results', async ({authedPage}) => {
    const prefix = programRequest().name;
    const programs = await Promise.all(Array.from({length: ITEMS_PER_PAGE + 1}, (_, i) => programApi.create(programRequest({name: `${prefix} ${i}`}))));
    try {
      const programListPage = new ProgramListPage(authedPage);
      await programListPage.goto();
      await programListPage.search(prefix);

      await programListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await programListPage.expectPage('1 / 2');
      await expect(programListPage.first).toHaveCount(0);
      await expect(programListPage.previous).toHaveCount(0);

      await programListPage.next.click();
      await programListPage.expectRowCount(prefix, 1);
      await programListPage.expectPage('2 / 2');
      await expect(programListPage.next).toHaveCount(0);
      await expect(programListPage.last).toHaveCount(0);

      await programListPage.previous.click();
      await programListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await programListPage.expectPage('1 / 2');

      await programListPage.last.click();
      await programListPage.expectRowCount(prefix, 1);
      await programListPage.expectPage('2 / 2');

      await programListPage.first.click();
      await programListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
      await programListPage.expectPage('1 / 2');
    } finally {
      await Promise.all(programs.map((program) => programApi.delete(program.uuid)));
    }
  });

});
