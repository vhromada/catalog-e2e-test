import { programApi } from '../../api/resources/ProgramApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { ProgramFormPage } from '../../pages/programs/ProgramFormPage';
import { ProgramListPage } from '../../pages/programs/ProgramListPage';
import { INVALID_UUID, programRequest, uniqueName } from '../../utils/testData';

test.describe('edit program (/programs/:uuid)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/programs/${INVALID_UUID}`);

    await new LoginPage(page).expectOpen();
  });

  test('prefills the form with the program from BE', async ({authedPage}) => {
    const program = await programApi.create(programRequest({
      wikiCz: 'Wiki_CZ',
      wikiEn: 'Wiki_EN',
      mediaCount: 4,
      format: 'BATTLE_NET',
      crack: true,
      serialKey: true,
      otherData: 'Other data',
      note: 'Note'
    }));
    try {
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoEdit(program.uuid);

      await programFormPage.expectEditOpen(program.uuid, {
        name: program.name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 4,
        format: 'BATTLE_NET',
        crack: true,
        serialKey: true,
        otherData: 'Other data',
        note: 'Note'
      });
      await expect(programFormPage.cancelButton).toBeVisible();
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('updates the program and stores it in BE', async ({authedPage}) => {
    const program = await programApi.create(programRequest({note: 'Note'}));
    const newName = uniqueName('Program');
    try {
      const programListPage = new ProgramListPage(authedPage);
      const programFormPage = new ProgramFormPage(authedPage);
      await programListPage.goto();
      await programListPage.search(program.name);
      await programListPage.edit(program.name);
      await programFormPage.expectEditOpen(program.uuid, {name: program.name, mediaCount: 1, format: 'ISO', note: 'Note'});
      await programFormPage.update({
        name: newName,
        wikiCz: 'New_CZ',
        wikiEn: 'New_EN',
        mediaCount: 2,
        format: 'STEAM',
        crack: true,
        serialKey: true,
        otherData: 'New other data',
        note: 'New note'
      });

      await programListPage.expectOpen();
      await programListPage.search(newName);
      await programListPage.expectRowCount(newName, 1);
      expect(await programApi.get(program.uuid)).toEqual({
        uuid: program.uuid,
        name: newName,
        wikiCz: 'New_CZ',
        wikiEn: 'New_EN',
        mediaCount: 2,
        format: 'STEAM',
        crack: true,
        serialKey: true,
        otherData: 'New other data',
        note: 'New note'
      });
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('clears the optional fields', async ({authedPage}) => {
    const program = await programApi.create(programRequest({wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', crack: true, otherData: 'Other data', note: 'Note'}));
    try {
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoEdit(program.uuid);
      await programFormPage.expectEditOpen(program.uuid, {
        name: program.name,
        wikiCz: 'Wiki_CZ',
        wikiEn: 'Wiki_EN',
        mediaCount: 1,
        format: 'ISO',
        crack: true,
        otherData: 'Other data',
        note: 'Note'
      });
      await programFormPage.update({name: program.name, mediaCount: 1, format: 'ISO'});

      await new ProgramListPage(authedPage).expectOpen();
      const updated = await programApi.get(program.uuid);
      expect(updated.crack).toBe(false);
      expect(updated.wikiCz).toBeFalsy();
      expect(updated.wikiEn).toBeFalsy();
      expect(updated.otherData).toBeFalsy();
      expect(updated.note).toBeFalsy();
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('saving without changes keeps the program unchanged', async ({authedPage}) => {
    const program = await programApi.create(programRequest({wikiCz: 'Wiki_CZ', mediaCount: 2, format: 'BINARY', serialKey: true, note: 'Note'}));
    try {
      const programListPage = new ProgramListPage(authedPage);
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoEdit(program.uuid);
      await programFormPage.expectEditOpen(program.uuid, {
        name: program.name,
        wikiCz: 'Wiki_CZ',
        mediaCount: 2,
        format: 'BINARY',
        serialKey: true,
        note: 'Note'
      });
      await programFormPage.updateButton.click();

      await programListPage.expectOpen();
      expect(await programApi.get(program.uuid)).toEqual(program);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoEdit(program.uuid);
      await programFormPage.expectEditOpen(program.uuid, {name: program.name, mediaCount: 1, format: 'ISO'});
      await programFormPage.name.fill(uniqueName('Program'));
      await programFormPage.cancel();

      await programListPage.expectOpen();
      expect((await programApi.get(program.uuid)).name).toBe(program.name);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('shows main menu and program menu', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programListPage = new ProgramListPage(authedPage);
      await new ProgramFormPage(authedPage).gotoEdit(program.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(programListPage.listNavigation).toBeVisible();
      await expect(programListPage.addNavigation).toBeVisible();
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoEdit(program.uuid);
      await programFormPage.expectEditOpen(program.uuid, {name: program.name, mediaCount: 1, format: 'ISO'});
      await programFormPage.update({name: '', mediaCount: '', format: 'ISO'});

      await programFormPage.expectError('Name is required');
      await programFormPage.expectError('Count of media is required');
      expect(await programApi.get(program.uuid)).toEqual(program);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('shows errors when fields are invalid', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    try {
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoEdit(program.uuid);
      await programFormPage.expectEditOpen(program.uuid, {name: program.name, mediaCount: 1, format: 'ISO'});
      await programFormPage.update({
        name: 'a'.repeat(201),
        wikiCz: 'b'.repeat(101),
        wikiEn: 'c'.repeat(101),
        mediaCount: 101,
        format: 'ISO',
        otherData: 'd'.repeat(101),
        note: 'e'.repeat(101)
      });

      await programFormPage.expectError('Maximum length of name is 200');
      await programFormPage.expectError('Maximum length of Czech Wikipedia is 100');
      await programFormPage.expectError('Maximum length of English Wikipedia is 100');
      await programFormPage.expectError('Maximum value of count of media is 100');
      await programFormPage.expectError('Maximum length of other data is 100');
      await programFormPage.expectError('Maximum length of note is 100');
      expect(await programApi.get(program.uuid)).toEqual(program);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const program = await programApi.create(programRequest());
    const newName = uniqueName('Program');
    try {
      const programListPage = new ProgramListPage(authedPage);
      const programFormPage = new ProgramFormPage(authedPage);
      await programFormPage.gotoEdit(program.uuid);
      await programFormPage.expectEditOpen(program.uuid, {name: program.name, mediaCount: 1, format: 'ISO'});
      await programFormPage.update({name: '', mediaCount: 1, format: 'ISO'});
      await programFormPage.expectError('Name is required');
      await programFormPage.update({name: newName, mediaCount: 1, format: 'ISO'});

      await programFormPage.expectNoError('Name is required');
      await programListPage.expectOpen();
      expect((await programApi.get(program.uuid)).name).toBe(newName);
    } finally {
      await programApi.delete(program.uuid);
    }
  });

});
