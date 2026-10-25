import { pictureApi } from '../../api/resources/PictureApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { PictureFormPage } from '../../pages/pictures/PictureFormPage';
import { PictureListPage } from '../../pages/pictures/PictureListPage';
import { ITEMS_PER_PAGE, pictureContent } from '../../utils/testData';

test.describe('picture list (/pictures)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/pictures');

    await new LoginPage(page).expectOpen();
  });

  test('shows heading', async ({authedPage}) => {
    const pictureListPage = new PictureListPage(authedPage);
    await pictureListPage.goto();

    await pictureListPage.expectOpen();
  });

  test('shows first page of pictures from BE', async ({authedPage}) => {
    const content = pictureContent();
    await pictureApi.create(content);
    try {
      const pictureListPage = new PictureListPage(authedPage);

      await expect(async () => {
        const before = await pictureApi.list(1, ITEMS_PER_PAGE);
        await pictureListPage.goto();
        await expect(pictureListPage.table).toBeVisible();
        const shown = await pictureListPage.images.evaluateAll((images: HTMLImageElement[]) => images.map((image) => image.src.split('/').pop()));
        const pageInfo = await pictureListPage.pageInfo.allInnerTexts();
        const after = await pictureApi.list(1, ITEMS_PER_PAGE);

        expect(after.data).toEqual(before.data);
        expect(shown).toEqual(before.data);
        expect(pageInfo).toEqual(before.pagingInfo.pagesCount > 1 ? [`1 / ${before.pagingInfo.pagesCount}`] : []);
      }).toPass();
    } finally {
      await pictureApi.deleteByContent(content);
    }
  });

  test('shows pictures stored in BE', async ({authedPage}) => {
    const content = pictureContent();
    const uuid = await pictureApi.createAndFind(content);
    try {
      const pictureListPage = new PictureListPage(authedPage);
      await pictureListPage.gotoRow(uuid);

      await pictureListPage.expectRowCount(uuid, 1);
    } finally {
      await pictureApi.delete(uuid);
    }
  });

  test('loads the picture image', async ({authedPage}) => {
    const content = pictureContent();
    const uuid = await pictureApi.createAndFind(content);
    try {
      const pictureListPage = new PictureListPage(authedPage);
      await pictureListPage.gotoRow(uuid);

      const image = pictureListPage.row(uuid).locator('img');
      await expect(image).toHaveAttribute('src', new RegExp(`/public/pictures/${uuid}$`));
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth)).toBeGreaterThan(0);
    } finally {
      await pictureApi.delete(uuid);
    }
  });

  test('shows main menu and picture menu', async ({authedPage}) => {
    const pictureListPage = new PictureListPage(authedPage);
    await pictureListPage.goto();

    await new CatalogPage(authedPage).expectMainMenu();
    await expect(pictureListPage.listNavigation).toBeVisible();
    await expect(pictureListPage.addNavigation).toBeVisible();
  });

  test('opens add form from the menu', async ({authedPage}) => {
    const pictureListPage = new PictureListPage(authedPage);
    await pictureListPage.goto();
    await pictureListPage.openAdd();

    await new PictureFormPage(authedPage).expectAddOpen();
  });

  test('returns to list from the menu', async ({authedPage}) => {
    const pictureListPage = new PictureListPage(authedPage);
    await new PictureFormPage(authedPage).gotoAdd();
    await pictureListPage.openList();

    await pictureListPage.expectOpen();
  });

  test('removes a picture', async ({authedPage}) => {
    const content = pictureContent();
    const uuid = await pictureApi.createAndFind(content);
    try {
      const pictureListPage = new PictureListPage(authedPage);
      await pictureListPage.gotoRow(uuid);
      await pictureListPage.remove(uuid);

      await pictureListPage.expectRowCount(uuid, 0);
      expect(await pictureApi.findByContent(content)).toHaveLength(0);
    } finally {
      await pictureApi.deleteByContent(content);
    }
  });

  test('pages through the pictures', async ({authedPage}) => {
    const contents = Array.from({length: ITEMS_PER_PAGE + 1}, () => pictureContent());
    for (const content of contents) {
      await pictureApi.create(content);
    }
    try {
      const pictureListPage = new PictureListPage(authedPage);
      await pictureListPage.goto();
      await expect(pictureListPage.pageInfo).toHaveText(/^1 \/ \d+$/);
      await expect(pictureListPage.first).toHaveCount(0);
      await expect(pictureListPage.previous).toHaveCount(0);

      await pictureListPage.next.click();
      await expect(pictureListPage.pageInfo).toHaveText(/^2 \/ \d+$/);
      await expect(pictureListPage.first).toBeVisible();
      await expect(pictureListPage.previous).toBeVisible();

      await pictureListPage.previous.click();
      await expect(pictureListPage.pageInfo).toHaveText(/^1 \/ \d+$/);

      await pictureListPage.last.click();
      await expect(pictureListPage.pageInfo).toHaveText(/^(\d+) \/ \1$/);
      await expect(pictureListPage.next).toHaveCount(0);
      await expect(pictureListPage.last).toHaveCount(0);

      await pictureListPage.first.click();
      await expect(pictureListPage.pageInfo).toHaveText(/^1 \/ \d+$/);
    } finally {
      for (const content of contents) {
        await pictureApi.deleteByContent(content);
      }
    }
  });

});
