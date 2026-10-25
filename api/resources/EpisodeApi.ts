import { apiClient } from '../ApiClient';

export interface Episode {
  uuid: string;
  number: number;
  name: string;
  length: number;
  note?: string;
}

interface EpisodePage {
  data: Episode[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeEpisodeRequest {
  number: number;
  name: string;
  length: number;
  note?: string;
}

export const episodeApi = {

  async create(showUuid: string, seasonUuid: string, request: ChangeEpisodeRequest): Promise<Episode> {
    const response = await apiClient.post<Episode>(`shows/${showUuid}/seasons/${seasonUuid}/episodes`, request);
    return response.data;
  },

  async get(showUuid: string, seasonUuid: string, uuid: string): Promise<Episode> {
    const response = await apiClient.get<Episode>(`shows/${showUuid}/seasons/${seasonUuid}/episodes/${uuid}`);
    return response.data;
  },

  async list(showUuid: string, seasonUuid: string, page = 1, limit = 50): Promise<EpisodePage> {
    const response = await apiClient.get<EpisodePage>(`shows/${showUuid}/seasons/${seasonUuid}/episodes`, {params: {page, limit}});
    return response.data;
  },

  async delete(showUuid: string, seasonUuid: string, uuid: string): Promise<void> {
    await apiClient.delete(`shows/${showUuid}/seasons/${seasonUuid}/episodes/${uuid}`);
  }

};
