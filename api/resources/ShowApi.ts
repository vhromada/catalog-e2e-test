import { apiClient } from '../ApiClient';
import type { Genre } from './GenreApi';

export interface Show {
  uuid: string;
  czechName: string;
  originalName: string;
  csfd?: string;
  imdbCode?: number;
  wikiEn?: string;
  wikiCz?: string;
  picture?: string;
  note?: string;
  genres: Genre[];
  seasonsCount: number;
  episodesCount: number;
  length: number;
}

export interface Statistics {
  count: number;
  seasonsCount: number;
  episodesCount: number;
  length: string;
}

interface ShowPage {
  data: Show[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeShowRequest {
  czechName: string;
  originalName: string;
  csfd?: string;
  imdbCode?: number;
  wikiEn?: string;
  wikiCz?: string;
  picture?: string;
  note?: string;
  genres: string[];
}

export const showApi = {

  async create(request: ChangeShowRequest): Promise<Show> {
    const response = await apiClient.post<Show>('shows', request);
    return response.data;
  },

  async get(uuid: string): Promise<Show> {
    const response = await apiClient.get<Show>(`shows/${uuid}`);
    return response.data;
  },

  async search(czechName: string): Promise<Show[]> {
    const response = await apiClient.get<{ data: Show[] }>('shows', {params: {czechName}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<ShowPage> {
    const response = await apiClient.get<ShowPage>('shows', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('shows/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`shows/${uuid}`);
  },

  async deleteByCzechName(czechName: string): Promise<void> {
    const shows = await this.search(czechName);
    await Promise.all(shows.map((show) => this.delete(show.uuid)));
  }

};
