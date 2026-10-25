import { apiClient } from '../ApiClient';
import type { Genre } from './GenreApi';

export interface Medium {
  number: number;
  length: number;
}

export interface Movie {
  uuid: string;
  czechName: string;
  originalName: string;
  year: number;
  languages: string[];
  subtitles: string[];
  media: Medium[];
  csfd?: string;
  imdbCode?: number;
  wikiEn?: string;
  wikiCz?: string;
  picture?: string;
  note?: string;
  genres: Genre[];
}

export interface Statistics {
  count: number;
  mediaCount: number;
  length: string;
}

interface MoviePage {
  data: Movie[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeMovieRequest {
  czechName: string;
  originalName: string;
  year: number;
  languages: string[];
  subtitles: string[];
  media: number[];
  csfd?: string;
  imdbCode?: number;
  wikiEn?: string;
  wikiCz?: string;
  picture?: string;
  note?: string;
  genres: string[];
}

export const movieApi = {

  async create(request: ChangeMovieRequest): Promise<Movie> {
    const response = await apiClient.post<Movie>('movies', request);
    return response.data;
  },

  async get(uuid: string): Promise<Movie> {
    const response = await apiClient.get<Movie>(`movies/${uuid}`);
    return response.data;
  },

  async search(czechName: string): Promise<Movie[]> {
    const response = await apiClient.get<{ data: Movie[] }>('movies', {params: {czechName}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<MoviePage> {
    const response = await apiClient.get<MoviePage>('movies', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('movies/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`movies/${uuid}`);
  },

  async deleteByCzechName(czechName: string): Promise<void> {
    const movies = await this.search(czechName);
    await Promise.all(movies.map((movie) => this.delete(movie.uuid)));
  }

};
