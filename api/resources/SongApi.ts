import { apiClient } from '../ApiClient';

export interface Song {
  uuid: string;
  name: string;
  length: number;
  note?: string;
}

interface SongPage {
  data: Song[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeSongRequest {
  name: string;
  length: number;
  note?: string;
}

export const songApi = {

  async create(musicUuid: string, request: ChangeSongRequest): Promise<Song> {
    const response = await apiClient.post<Song>(`music/${musicUuid}/songs`, request);
    return response.data;
  },

  async get(musicUuid: string, uuid: string): Promise<Song> {
    const response = await apiClient.get<Song>(`music/${musicUuid}/songs/${uuid}`);
    return response.data;
  },

  async list(musicUuid: string, page = 1, limit = 50): Promise<SongPage> {
    const response = await apiClient.get<SongPage>(`music/${musicUuid}/songs`, {params: {page, limit}});
    return response.data;
  },

  async delete(musicUuid: string, uuid: string): Promise<void> {
    await apiClient.delete(`music/${musicUuid}/songs/${uuid}`);
  }

};
