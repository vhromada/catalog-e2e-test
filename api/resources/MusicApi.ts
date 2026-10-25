import { apiClient } from '../ApiClient';

export interface Music {
  uuid: string;
  name: string;
  wikiEn?: string;
  wikiCz?: string;
  mediaCount: number;
  note?: string;
  songsCount: number;
  length: number;
}

export interface Statistics {
  count: number;
  songsCount: number;
  mediaCount: number;
  length: string;
}

interface MusicPage {
  data: Music[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeMusicRequest {
  name: string;
  wikiEn?: string;
  wikiCz?: string;
  mediaCount: number;
  note?: string;
}

export const musicApi = {

  async create(request: ChangeMusicRequest): Promise<Music> {
    const response = await apiClient.post<Music>('music', request);
    return response.data;
  },

  async get(uuid: string): Promise<Music> {
    const response = await apiClient.get<Music>(`music/${uuid}`);
    return response.data;
  },

  async search(name: string): Promise<Music[]> {
    const response = await apiClient.get<{ data: Music[] }>('music', {params: {name}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<MusicPage> {
    const response = await apiClient.get<MusicPage>('music', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('music/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`music/${uuid}`);
  },

  async deleteByName(name: string): Promise<void> {
    const musicList = await this.search(name);
    await Promise.all(musicList.map((music) => this.delete(music.uuid)));
  }

};
