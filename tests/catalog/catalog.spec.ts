import { expect, test } from '../../fixtures/test';
import { AuthorListPage } from '../../pages/authors/AuthorListPage';
import { BookListPage } from '../../pages/books/BookListPage';
import { CatalogPage } from '../../pages/CatalogPage';
import { GameListPage } from '../../pages/games/GameListPage';
import { GenreListPage } from '../../pages/genres/GenreListPage';
import { JokeListPage } from '../../pages/jokes/JokeListPage';
import { LoginPage } from '../../pages/LoginPage';
import { MovieListPage } from '../../pages/movies/MovieListPage';
import { MusicListPage } from '../../pages/music/MusicListPage';
import { PictureListPage } from '../../pages/pictures/PictureListPage';
import { ProgramListPage } from '../../pages/programs/ProgramListPage';
import { ShowListPage } from '../../pages/shows/ShowListPage';

test.describe('catalog (/)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await new CatalogPage(page).goto();

    await new LoginPage(page).expectOpen();
  });

  test('shows catalog home for logged in user', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();

    await catalogPage.expectOpen();
    await expect(catalogPage.logoutLink).toBeVisible();
  });

  test('shows main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();

    await catalogPage.expectMainMenu();
  });

  test('opens authors from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openAuthors();

    await new AuthorListPage(authedPage).expectOpen();
  });

  test('opens books from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openBooks();

    await new BookListPage(authedPage).expectOpen();
  });

  test('opens games from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openGames();

    await new GameListPage(authedPage).expectOpen();
  });

  test('opens movies from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openMovies();

    await new MovieListPage(authedPage).expectOpen();
  });

  test('opens shows from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openShows();

    await new ShowListPage(authedPage).expectOpen();
  });

  test('opens music from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openMusic();

    await new MusicListPage(authedPage).expectOpen();
  });

  test('opens jokes from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openJokes();

    await new JokeListPage(authedPage).expectOpen();
  });

  test('opens genres from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openGenres();

    await new GenreListPage(authedPage).expectOpen();
  });

  test('opens programs from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openPrograms();

    await new ProgramListPage(authedPage).expectOpen();
  });

  test('opens pictures from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await catalogPage.goto();
    await catalogPage.openPictures();

    await new PictureListPage(authedPage).expectOpen();
  });

  test('returns to catalog home from the main menu', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    await new GenreListPage(authedPage).goto();
    await catalogPage.openCatalog();

    await catalogPage.expectOpen();
  });

  test('logout returns to login', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    const loginPage = new LoginPage(authedPage);
    await catalogPage.goto();
    await catalogPage.logout();

    await loginPage.expectOpen();
  });

  test('logout does not allow to go back to the catalog', async ({authedPage}) => {
    const catalogPage = new CatalogPage(authedPage);
    const loginPage = new LoginPage(authedPage);
    await catalogPage.goto();
    await catalogPage.logout();
    await loginPage.expectOpen();
    await authedPage.goBack();

    await loginPage.expectOpen();
    await expect(catalogPage.logoutLink).toHaveCount(0);
  });

});
