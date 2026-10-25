import { apiClient } from '../ApiClient';

export interface Season {
  uuid: string;
  number: number;
  startYear: number;
  endYear: number;
  language: string;
  subtitles: string[];
  note?: string;
  episodesCount: number;
  length: number;
}

interface SeasonPage {
  data: Season[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeSeasonRequest {
  number: number;
  startYear: number;
  endYear: number;
  language: string;
  subtitles: string[];
  note?: string;
}

export const seasonApi = {

  async create(showUuid: string, request: ChangeSeasonRequest): Promise<Season> {
    const response = await apiClient.post<Season>(`shows/${showUuid}/seasons`, request);
    return response.data;
  },

  async get(showUuid: string, uuid: string): Promise<Season> {
    const response = await apiClient.get<Season>(`shows/${showUuid}/seasons/${uuid}`);
    return response.data;
  },

  async list(showUuid: string, page = 1, limit = 50): Promise<SeasonPage> {
    const response = await apiClient.get<SeasonPage>(`shows/${showUuid}/seasons`, {params: {page, limit}});
    return response.data;
  },

  async delete(showUuid: string, uuid: string): Promise<void> {
    await apiClient.delete(`shows/${showUuid}/seasons/${uuid}`);
  }

};
