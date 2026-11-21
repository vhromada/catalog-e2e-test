import { apiClient } from '../ApiClient';

export interface Handbook {
  uuid: string;
  content: string;
}

export interface ChangeHandbookRequest {
  content: string;
}

export const handbookApi = {

  async create(gameUuid: string, request: ChangeHandbookRequest): Promise<Handbook> {
    const response = await apiClient.post<Handbook>(`games/${gameUuid}/handbooks`, request);
    return response.data;
  },

  async find(gameUuid: string): Promise<Handbook> {
    const response = await apiClient.get<Handbook>(`games/${gameUuid}/handbooks`);
    return response.data;
  },

  async get(gameUuid: string, uuid: string): Promise<Handbook> {
    const response = await apiClient.get<Handbook>(`games/${gameUuid}/handbooks/${uuid}`);
    return response.data;
  }

};
