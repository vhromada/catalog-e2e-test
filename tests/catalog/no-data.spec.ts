import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { INVALID_UUID } from '../../utils/testData';

const lists = [
  {name: 'book items', path: `/books/${INVALID_UUID}/items`, api: /\/rest\/books\/[^/]+\/items(\?.*)?$/, heading: 'Book items', message: 'No book items'},
  {name: 'episodes', path: `/shows/${INVALID_UUID}/seasons/${INVALID_UUID}/episodes`, api: /\/rest\/shows\/[^/]+\/seasons\/[^/]+\/episodes(\?.*)?$/, heading: 'Episodes', message: 'No episodes'},
  {name: 'pictures', path: '/pictures', api: /\/rest\/pictures(\?.*)?$/, heading: 'Pictures', message: 'No pictures'},
  {name: 'seasons', path: `/shows/${INVALID_UUID}/seasons`, api: /\/rest\/shows\/[^/]+\/seasons(\?.*)?$/, heading: 'Seasons', message: 'No seasons'},
  {name: 'songs', path: `/music/${INVALID_UUID}/songs`, api: /\/rest\/music\/[^/]+\/songs(\?.*)?$/, heading: 'Songs', message: 'No songs'}
];

// The lists are shared with tests running in parallel (pictures) or belong to parents that need a lot of setup (seasons, episodes),
// so the BE answers with an empty page.
async function mockEmptyList(page: Page, api: RegExp): Promise<void> {
  await page.route(api, async (route) => {
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': route.request().headers()['access-control-request-headers'] ?? '*',
      'access-control-allow-methods': '*'
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({status: 204, headers});
    } else {
      await route.fulfill({status: 200, headers, contentType: 'application/json', body: JSON.stringify({data: [], pagingInfo: {pageNumber: 1, pagesCount: 1}})});
    }
  });
}

test.describe('no data message of lists', () => {

  for (const list of lists) {
    test(`shows no data message when there are no ${list.name}`, async ({authedPage}) => {
      await mockEmptyList(authedPage, list.api);
      await authedPage.goto(list.path);

      await expect(authedPage.getByRole('heading', {name: list.heading})).toBeVisible();
      await expect(authedPage.locator('#noData')).toHaveText(list.message);
      await expect(authedPage.locator('table:visible')).toHaveCount(0);
      await expect(authedPage.locator('#pageInfo')).toHaveCount(0);
    });
  }

});
