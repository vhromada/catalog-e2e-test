import { apiClient } from '../ApiClient';

export interface Genre {
  uuid: string;
  name: string;
}

export interface Statistics {
  count: number;
}

interface GenrePage {
  data: Genre[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeGenreRequest {
  name: string;
}

export const genreApi = {

  async create(request: ChangeGenreRequest): Promise<Genre> {
    const response = await apiClient.post<Genre>('genres', request);
    return response.data;
  },

  async get(uuid: string): Promise<Genre> {
    const response = await apiClient.get<Genre>(`genres/${uuid}`);
    return response.data;
  },

  async search(name: string): Promise<Genre[]> {
    const response = await apiClient.get<{ data: Genre[] }>('genres', {params: {name}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<GenrePage> {
    const response = await apiClient.get<GenrePage>('genres', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('genres/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`genres/${uuid}`);
  },

  async deleteByName(name: string): Promise<void> {
    const genres = await this.search(name);
    await Promise.all(genres.map((genre) => this.delete(genre.uuid)));
  }

};
