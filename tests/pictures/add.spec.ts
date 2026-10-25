import { pictureApi } from '../../api/resources/PictureApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { PictureFormPage } from '../../pages/pictures/PictureFormPage';
import { PictureListPage } from '../../pages/pictures/PictureListPage';
import { pictureContent } from '../../utils/testData';

const MAX_SIZE = 5242880;

test.describe('add picture (/pictures/add)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/pictures/add');

    await new LoginPage(page).expectOpen();
  });

  test('shows empty form', async ({authedPage}) => {
    const pictureFormPage = new PictureFormPage(authedPage);
    await pictureFormPage.gotoAdd();

    await pictureFormPage.expectAddOpen();
    await expect(pictureFormPage.file).toBeVisible();
    await expect(pictureFormPage.cancelButton).toBeVisible();
  });

  test('adds a picture and stores it in BE', async ({authedPage}) => {
    const content = pictureContent();
    try {
      const pictureListPage = new PictureListPage(authedPage);
      const pictureFormPage = new PictureFormPage(authedPage);
      await pictureListPage.goto();
      await pictureListPage.openAdd();
      await pictureFormPage.expectAddOpen();
      await pictureFormPage.create(content);

      await pictureListPage.expectOpen();
      const uuids = await pictureApi.findByContent(content);
      expect(uuids).toHaveLength(1);
      await pictureListPage.gotoRow(uuids[0]);
    } finally {
      await pictureApi.deleteByContent(content);
    }
  });

  test('adds a picture with the maximum size', async ({authedPage}) => {
    const content = pictureContent(MAX_SIZE);
    try {
      const pictureFormPage = new PictureFormPage(authedPage);
      await pictureFormPage.gotoAdd();
      await pictureFormPage.create(content);

      await new PictureListPage(authedPage).expectOpen();
      expect(await pictureApi.findByContent(content)).toHaveLength(1);
    } finally {
      await pictureApi.deleteByContent(content);
    }
  });

  test('cancel returns to list without saving', async ({authedPage}) => {
    const content = pictureContent();
    const pictureFormPage = new PictureFormPage(authedPage);
    await pictureFormPage.gotoAdd();
    await pictureFormPage.choose(content);
    await pictureFormPage.cancel();

    await new PictureListPage(authedPage).expectOpen();
    expect(await pictureApi.findByContent(content)).toHaveLength(0);
  });

  test('shows main menu and picture menu', async ({authedPage}) => {
    const pictureListPage = new PictureListPage(authedPage);
    await new PictureFormPage(authedPage).gotoAdd();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(pictureListPage.listNavigation).toBeVisible();
    await expect(pictureListPage.addNavigation).toBeVisible();
  });

  test('shows errors when required fields are empty', async ({authedPage}) => {
    const pictureFormPage = new PictureFormPage(authedPage);
    await pictureFormPage.gotoAdd();
    await pictureFormPage.createButton.click();

    await pictureFormPage.expectError('Picture is required');
    await pictureFormPage.expectAddOpen();
  });

  test('shows errors when fields are too long', async ({authedPage}) => {
    const content = pictureContent(MAX_SIZE + 1);
    const pictureFormPage = new PictureFormPage(authedPage);
    await pictureFormPage.gotoAdd();
    await pictureFormPage.create(content);

    await pictureFormPage.expectError('Max size is 5MB');
    await pictureFormPage.expectAddOpen();
    expect(await pictureApi.findByContent(content)).toHaveLength(0);
  });

  test('keeps the too large error after clicking create again', async ({authedPage}) => {
    const content = pictureContent(MAX_SIZE + 1);
    const pictureFormPage = new PictureFormPage(authedPage);
    await pictureFormPage.gotoAdd();
    await pictureFormPage.choose(content);
    await pictureFormPage.expectError('Max size is 5MB');
    await pictureFormPage.createButton.click();

    await pictureFormPage.expectError('Max size is 5MB');
    await pictureFormPage.expectNoError('Picture is required');
    await pictureFormPage.expectAddOpen();
    expect(await pictureApi.findByContent(content)).toHaveLength(0);
  });

  test('clears the errors after the fields are corrected', async ({authedPage}) => {
    const content = pictureContent();
    try {
      const pictureFormPage = new PictureFormPage(authedPage);
      await pictureFormPage.gotoAdd();
      await pictureFormPage.createButton.click();
      await pictureFormPage.expectError('Picture is required');
      await pictureFormPage.create(content);

      await pictureFormPage.expectNoError('Picture is required');
      await new PictureListPage(authedPage).expectOpen();
      expect(await pictureApi.findByContent(content)).toHaveLength(1);
    } finally {
      await pictureApi.deleteByContent(content);
    }
  });

  test('shows error after too large picture is replaced by a valid one', async ({authedPage}) => {
    const content = pictureContent();
    try {
      const pictureFormPage = new PictureFormPage(authedPage);
      await pictureFormPage.gotoAdd();
      await pictureFormPage.choose(pictureContent(MAX_SIZE + 1));
      await pictureFormPage.expectError('Max size is 5MB');
      await pictureFormPage.choose(content);
      await pictureFormPage.createButton.click();

      await pictureFormPage.expectNoError('Max size is 5MB');
      await new PictureListPage(authedPage).expectOpen();
      expect(await pictureApi.findByContent(content)).toHaveLength(1);
    } finally {
      await pictureApi.deleteByContent(content);
    }
  });

});
