import { programApi } from '../../api/resources/ProgramApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { ProgramFormPage } from '../../pages/programs/ProgramFormPage';
import { ProgramListPage } from '../../pages/programs/ProgramListPage';
import { uniqueName } from '../../utils/testData';

test.describe('add program (/programs/add)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/programs/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const programFormPage = new ProgramFormPage(authedPage);
    await programFormPage.gotoAdd();

    await programFormPage.expectAddOpen();
    await expect(programFormPage.name).toHaveValue('');
    await expect(programFormPage.wikiCz).toHaveValue('');
    await expect(programFormPage.wikiEn).toHaveValue('');
    await expect(programFormPage.mediaCount).toHaveValue('1');
    await expect(programFormPage.formats.first()).toBeVisible();
    expect(await programFormPage.formats.evaluateAll((inputs: HTMLInputElement[]) => inputs.some((input) => input.checked))).toBe(false);
    await expect(programFormPage.crack).not.toBeChecked();
    await expect(programFormPage.serialKey).not.toBeChecked();
    await expect(programFormPage.otherData).toHaveValue('');
    await expect(programFormPage.note).toHaveValue('');
    await expect(programFormPage.cancelButton).toBeVisible();
  });

  test('lists the formats from BE', async ({authedPage}) => {
    const programFormPage = new ProgramFormPage(authedPage);
    await programFormPage.gotoAdd();

    await expect(programFormPage.formats).toHaveCount(4);
    for (const format of ['ISO', 'BINARY', 'STEAM', 'BATTLE_NET']) {
      await expect(programFormPage.format(format)).toBeVisible();
    }
  });

  test('adds a program and stores it in BE', async ({authedPage}) => {
    const name = uniqueName('Program');
    try {
      const programListPage = new ProgramListPage(authedPage);
      const programFormPage = new ProgramFormPage(authedPage);
      await programListPage.goto();
      await programListPage.openAdd();
      await programFormPage.expectAddOpen();
      await programFormPage.create({
        name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 3,
        format: 'STEAM',
        crack: true,
        serialKey: true,
        otherData: 'Other data',
        note: 'Note'
      });

      await programListPage.expectOpen();
      await programListPage.search(name);
      await programListPage.expectRowCount(name, 1);
      const programs = await programApi.search(name);
      expect(programs).toHaveLength(1);
      expect(programs[0]).toMatchObject({
        name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 3,
        format: 'STEAM',
        crack: true,
        serialKey: true,
        otherData: 'Other data',
        note: 'Note'
      });
    } finally {
      await programApi.deleteByName(name);
    }
  });

  test('adds a program with only the required fields', async ({authedPage}) => {
    const name = uniqueName('Program');
    try {
      const programListPage = new ProgramListPage(authedPage);
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoAdd();
      await programFormPage.create({name, mediaCount: 1, format: 'ISO'});

      await programListPage.expectOpen();
      const programs = await programApi.search(name);
      expect(programs).toHaveLength(1);
      expect(programs[0]).toMatchObject({name, mediaCount: 1, format: 'ISO', crack: false, serialKey: false});
      expect(programs[0].wikiCz).toBeFalsy();
      expect(programs[0].wikiEn).toBeFalsy();
      expect(programs[0].otherData).toBeFalsy();
      expect(programs[0].note).toBeFalsy();
    } finally {
      await programApi.deleteByName(name);
    }
  });

  test('adds a program with the maximum field values', async ({authedPage}) => {
    const name = uniqueName('Program').padEnd(200, 'a');
    try {
      const programListPage = new ProgramListPage(authedPage);
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoAdd();
      await programFormPage.create({
        name,
        wikiCz: 'b'.repeat(100),
        wikiEn: 'c'.repeat(100),
        mediaCount: 100,
        format: 'ISO',
        otherData: 'd'.repeat(100),
        note: 'e'.repeat(100)
      });

      await programListPage.expectOpen();
      const programs = await programApi.search(name);
      expect(programs).toHaveLength(1);
      expect(programs[0]).toMatchObject({
        name,
        wikiCz: 'b'.repeat(100),
        wikiEn: 'c'.repeat(100),
        mediaCount: 100,
        otherData: 'd'.repeat(100),
        note: 'e'.repeat(100)
      });
    } finally {
      await programApi.deleteByName(name);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const name = uniqueName('Program');
    const programListPage = new ProgramListPage(authedPage);
    const programFormPage = new ProgramFormPage(authedPage);
    await programFormPage.gotoAdd();
    await programFormPage.name.fill(name);
    await programFormPage.cancel();

    await programListPage.expectOpen();
    expect(await programApi.search(name)).toHaveLength(0);
  });

  test('shows main menu and program menu', async ({authedPage}) => {
    const programListPage = new ProgramListPage(authedPage);
    await new ProgramFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(programListPage.listNavigation).toBeVisible();
    await expect(programListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const programFormPage = new ProgramFormPage(authedPage);
    await programFormPage.gotoAdd();
    await expect(programFormPage.formats.first()).toBeVisible();
    await programFormPage.mediaCount.fill('');
    await programFormPage.createButton.click();

    await programFormPage.expectError('Name is required');
    await programFormPage.expectError('Count of media is required');
    await programFormPage.expectError('Format is required');
    await programFormPage.expectNoError('Note is required');
    await programFormPage.expectAddOpen();
  });

  test('shows errors when count of media is out of range', async ({authedPage}) => {
    const name = uniqueName('Program');
    const programFormPage = new ProgramFormPage(authedPage);
    await programFormPage.gotoAdd();
    await programFormPage.create({name, mediaCount: 0, format: 'ISO'});

    await programFormPage.expectError('Minimum value of count of media is 1');
    await programFormPage.expectAddOpen();

    await programFormPage.create({name, mediaCount: 101, format: 'ISO'});

    await programFormPage.expectError('Maximum value of count of media is 100');
    await programFormPage.expectAddOpen();
    expect(await programApi.search(name)).toHaveLength(0);
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const name = 'a'.repeat(201);
    const programFormPage = new ProgramFormPage(authedPage);
    await programFormPage.gotoAdd();
    await programFormPage.create({
      name,
      wikiCz: 'b'.repeat(101),
      wikiEn: 'c'.repeat(101),
      mediaCount: 1,
      format: 'ISO',
      otherData: 'd'.repeat(101),
      note: 'e'.repeat(101)
    });

    await programFormPage.expectError('Maximum length of name is 200');
    await programFormPage.expectError('Maximum length of Czech Wikipedia is 100');
    await programFormPage.expectError('Maximum length of English Wikipedia is 100');
    await programFormPage.expectError('Maximum length of other data is 100');
    await programFormPage.expectError('Maximum length of note is 100');
    await programFormPage.expectAddOpen();
    expect(await programApi.search(name)).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const name = uniqueName('Program');
    try {
      const programListPage = new ProgramListPage(authedPage);
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoAdd();
      await expect(programFormPage.formats.first()).toBeVisible();
      await programFormPage.createButton.click();
      await programFormPage.expectError('Name is required');
      await programFormPage.expectError('Format is required');
      await programFormPage.create({name, mediaCount: 1, format: 'ISO'});

      await programFormPage.expectNoError('Name is required');
      await programFormPage.expectNoError('Format is required');
      await programListPage.expectOpen();
      expect(await programApi.search(name)).toHaveLength(1);
    } finally {
      await programApi.deleteByName(name);
    }
  });

});
