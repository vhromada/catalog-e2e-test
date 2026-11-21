import { apiClient } from '../ApiClient';

export interface Walkthrough {
  uuid: string;
  content: string;
}

export interface ChangeWalkthroughRequest {
  content: string;
}

export const walkthroughApi = {

  async create(gameUuid: string, request: ChangeWalkthroughRequest): Promise<Walkthrough> {
    const response = await apiClient.post<Walkthrough>(`games/${gameUuid}/walkthroughs`, request);
    return response.data;
  },

  async find(gameUuid: string): Promise<Walkthrough> {
    const response = await apiClient.get<Walkthrough>(`games/${gameUuid}/walkthroughs`);
    return response.data;
  },

  async get(gameUuid: string, uuid: string): Promise<Walkthrough> {
    const response = await apiClient.get<Walkthrough>(`games/${gameUuid}/walkthroughs/${uuid}`);
    return response.data;
  }

};
