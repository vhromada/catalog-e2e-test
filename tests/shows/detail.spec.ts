import { episodeApi } from '../../api/resources/EpisodeApi';
import { type Genre, genreApi } from '../../api/resources/GenreApi';
import { pictureApi } from '../../api/resources/PictureApi';
import { seasonApi } from '../../api/resources/SeasonApi';
import { showApi } from '../../api/resources/ShowApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { LoginPage } from '../../pages/LoginPage';
import { SeasonListPage } from '../../pages/seasons/SeasonListPage';
import { ShowDetailPage } from '../../pages/shows/ShowDetailPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';
import { episodeRequest, genreRequest, INVALID_UUID, pictureContent, seasonRequest, showRequest } from '../../utils/testData';

test.describe('show detail (/shows/:uuid/detail)', () => {

  let genre: Genre;

  test.beforeEach(async () => {
    genre = await genreApi.create(genreRequest());
  });

  test.afterEach(async () => {
    await genreApi.delete(genre.uuid);
  });

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto(`/shows/${INVALID_UUID}/detail`);

    await new LoginPage(page).expectOpen();
  });

  test('shows the show from BE', async ({authedPage}) => {
    const second = await genreApi.create(genreRequest());
    const show = await showApi.create(showRequest([genre.uuid, second.uuid], {csfd: 'csfd', imdbCode: 123, wikiCz: 'Wiki_CZ', wikiEn: 'Wiki_EN', note: 'Note'}));
    try {
      const showDetailPage = new ShowDetailPage(authedPage);
      await showDetailPage.goto(show.uuid);

      await showDetailPage.expectOpen(show.uuid);
      await expect(showDetailPage.value('Czech name')).toHaveText(show.czechName);
      await expect(showDetailPage.value('Original name')).toHaveText(show.originalName);
      await expect(showDetailPage.value('Genres')).toContainText(genre.name);
      await expect(showDetailPage.value('Genres')).toContainText(second.name);
      await expect(showDetailPage.value('Count of seasons')).toHaveText('0');
      await expect(showDetailPage.value('Count of episodes')).toHaveText('0');
      await expect(showDetailPage.value('Note')).toHaveText('Note');
      await expect(showDetailPage.csfdLink).toHaveAttribute('href', 'https://www.csfd.cz/film/csfd');
      await expect(showDetailPage.imdbLink).toHaveAttribute('href', 'https://www.imdb.com/title/tt0000123');
      await expect(showDetailPage.wikiCzLink).toHaveAttribute('href', 'https://cz.wikipedia.org/wiki/Wiki_CZ');
      await expect(showDetailPage.wikiEnLink).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Wiki_EN');
    } finally {
      await showApi.delete(show.uuid);
      await genreApi.delete(second.uuid);
    }
  });

  test('shows the picture of the show', async ({authedPage}) => {
    const picture = await pictureApi.createAndFind(pictureContent());
    const show = await showApi.create(showRequest([genre.uuid], {picture}));
    try {
      const showDetailPage = new ShowDetailPage(authedPage);
      await showDetailPage.goto(show.uuid);

      await expect(showDetailPage.picture).toHaveAttribute('src', new RegExp(`/${picture}$`));
    } finally {
      await showApi.delete(show.uuid);
      await pictureApi.delete(picture);
    }
  });

  test('hides the optional fields when they are not set', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showDetailPage = new ShowDetailPage(authedPage);
      await showDetailPage.goto(show.uuid);

      await expect(showDetailPage.value('Czech name')).toHaveText(show.czechName);
      await expect(showDetailPage.picture).toHaveCount(0);
      await expect(showDetailPage.row('Total length')).toHaveCount(0);
      await expect(showDetailPage.row('Note')).toHaveCount(0);
      await expect(showDetailPage.csfdLink).toHaveCount(0);
      await expect(showDetailPage.imdbLink).toHaveCount(0);
      await expect(showDetailPage.wikiCzLink).toHaveCount(0);
      await expect(showDetailPage.wikiEnLink).toHaveCount(0);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('shows count of seasons and episodes and total length', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const first = await seasonApi.create(show.uuid, seasonRequest({number: 1}));
      const second = await seasonApi.create(show.uuid, seasonRequest({number: 2}));
      await episodeApi.create(show.uuid, first.uuid, episodeRequest({length: 65}));
      await episodeApi.create(show.uuid, second.uuid, episodeRequest({length: 3600}));
      const showDetailPage = new ShowDetailPage(authedPage);
      await showDetailPage.goto(show.uuid);

      await expect(showDetailPage.value('Count of seasons')).toHaveText('2');
      await expect(showDetailPage.value('Count of episodes')).toHaveText('2');
      await expect(showDetailPage.value('Total length')).toHaveText('1:01:05');
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('opens seasons of the show', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showDetailPage = new ShowDetailPage(authedPage);
      await showDetailPage.goto(show.uuid);
      await showDetailPage.seasonsLink.click();

      await new SeasonListPage(authedPage).expectOpen(show.uuid);
    } finally {
      await showApi.delete(show.uuid);
    }
  });

  test('shows main menu and show menu', async ({authedPage}) => {
    const show = await showApi.create(showRequest([genre.uuid]));
    try {
      const showListPage = new ShowListPage(authedPage);
      await new ShowDetailPage(authedPage).goto(show.uuid);

      await new CatalogPage(authedPage).expectMainMenu();
      await expect(showListPage.listNavigation).toBeVisible();
      await expect(showListPage.addNavigation).toBeVisible();
    } finally {
      await showApi.delete(show.uuid);
    }
  });

});
