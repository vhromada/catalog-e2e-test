import { programApi } from '../../api/resources/ProgramApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { ProgramDetailPage } from '../../pages/programs/ProgramDetailPage';
import { ProgramListPage } from '../../pages/programs/ProgramListPage';
import { INVALID_UUID, programRequest } from '../../utils/testData';

test.describe('program detail (/programs/:uuid/detail)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/programs/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the program from BE', async ({authedPage}) => {
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
      const programDetailPage = new ProgramDetailPage(authedPage);
      await programDetailPage.goto(program.uuid);

      await programDetailPage.expectOpen(program.uuid);
      await expect(programDetailPage.value('Name')).toHaveText(program.name);
      await expect(programDetailPage.value('Count of media')).toHaveText('3');
      await expect(programDetailPage.value('Format')).toHaveText('Binary file');
      await expect(programDetailPage.value('Additional data')).toHaveText('Crack, serial key, Other data');
      await expect(programDetailPage.value('Note')).toHaveText('Note');
      await expect(programDetailPage.wikiCzLink).toHaveAttribute('href', 'https://cz.wikipedia.org/wiki/Wiki_CZ');
      await expect(programDetailPage.wikiEnLink).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Wiki_EN');
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('hides the optional fields when they are not set', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programDetailPage = new ProgramDetailPage(authedPage);
      await programDetailPage.goto(program.uuid);

      await expect(programDetailPage.value('Name')).toHaveText(program.name);
      await expect(programDetailPage.value('Format')).toHaveText('ISO');
      await expect(programDetailPage.row('Additional data')).toHaveCount(0);
      await expect(programDetailPage.row('Note')).toHaveCount(0);
      await expect(programDetailPage.wikiCzLink).toHaveCount(0);
      await expect(programDetailPage.wikiEnLink).toHaveCount(0);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('shows only crack as additional data', async ({authedPage}) => {
    const program = await programApi.create(programRequest({crack: true}));
    try {
      const programDetailPage = new ProgramDetailPage(authedPage);
      await programDetailPage.goto(program.uuid);

      await expect(programDetailPage.value('Additional data')).toHaveText('Crack');
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('shows only serial key as additional data', async ({authedPage}) => {
    const program = await programApi.create(programRequest({serialKey: true}));
    try {
      const programDetailPage = new ProgramDetailPage(authedPage);
      await programDetailPage.goto(program.uuid);

      await expect(programDetailPage.value('Additional data')).toHaveText('Serial key');
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('shows main menu and program menu', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);
      await new ProgramDetailPage(authedPage).goto(program.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(programListPage.listNavigation).toBeVisible();
      await expect(programListPage.addNavigation).toBeVisible();
    } finally {
      await programApi.delete(program.uuid);
    }
  });

});
