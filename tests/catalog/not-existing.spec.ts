import { expect, test } from '../../fixtures/test';
import { ResultErrorModal } from '../../pages/ResultErrorModal';
import { INVALID_UUID } from '../../utils/testData';

const routes = [
  {name: 'edit author', path: `/authors/${INVALID_UUID}`},
  {name: 'edit book', path: `/books/${INVALID_UUID}`},
  {name: 'book detail', path: `/books/${INVALID_UUID}/detail`},
  {name: 'edit book item', path: `/books/${INVALID_UUID}/items/${INVALID_UUID}`},
  {name: 'book item detail', path: `/books/${INVALID_UUID}/items/${INVALID_UUID}/detail`},
  {name: 'edit game', path: `/games/${INVALID_UUID}`},
  {name: 'game detail', path: `/games/${INVALID_UUID}/detail`},
  {name: 'edit cheats', path: `/games/${INVALID_UUID}/cheats/${INVALID_UUID}`},
  {name: 'edit genre', path: `/genres/${INVALID_UUID}`},
  {name: 'edit joke', path: `/jokes/${INVALID_UUID}`},
  {name: 'joke detail', path: `/jokes/${INVALID_UUID}/detail`},
  {name: 'edit movie', path: `/movies/${INVALID_UUID}`},
  {name: 'movie detail', path: `/movies/${INVALID_UUID}/detail`},
  {name: 'edit music', path: `/music/${INVALID_UUID}`},
  {name: 'music detail', path: `/music/${INVALID_UUID}/detail`},
  {name: 'edit song', path: `/music/${INVALID_UUID}/songs/${INVALID_UUID}`},
  {name: 'song detail', path: `/music/${INVALID_UUID}/songs/${INVALID_UUID}/detail`},
  {name: 'edit program', path: `/programs/${INVALID_UUID}`},
  {name: 'program detail', path: `/programs/${INVALID_UUID}/detail`},
  {name: 'edit show', path: `/shows/${INVALID_UUID}`},
  {name: 'show detail', path: `/shows/${INVALID_UUID}/detail`},
  {name: 'edit season', path: `/shows/${INVALID_UUID}/seasons/${INVALID_UUID}`},
  {name: 'season detail', path: `/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/detail`},
  {name: 'edit episode', path: `/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/episodes/${INVALID_UUID}`},
  {name: 'episode detail', path: `/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/episodes/${INVALID_UUID}/detail`}
];

test.describe('items which do not exist in BE', () => {

  for (const route of routes) {
    test(`shows the error for ${route.name}`, async ({authedPage}) => {
      await authedPage.goto(route.path);

      await new ResultErrorModal(authedPage).expectOpen();
      await expect(authedPage).toHaveURL(new RegExp(`${route.path}$`));
      await expect(authedPage.locator('form')).toHaveCount(0);
    });
  }

  test('shows the error for edit roles', async ({adminPage}) => {
    await adminPage.goto(`/accounts/${INVALID_UUID}/roles`);

    await new ResultErrorModal(adminPage).expectOpen();
    await expect(adminPage).toHaveURL(new RegExp(`/accounts/${INVALID_UUID}/roles$`));
  });

});
