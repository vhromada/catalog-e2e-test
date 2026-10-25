import { apiClient } from '../ApiClient';

export interface CheatData {
  action: string;
  description: string;
}

export interface Cheat {
  uuid: string;
  gameSetting?: string;
  cheatSetting?: string;
  data: CheatData[];
}

export interface ChangeCheatRequest {
  gameSetting?: string;
  cheatSetting?: string;
  data: CheatData[];
}

export const cheatApi = {

  async create(gameUuid: string, request: ChangeCheatRequest): Promise<Cheat> {
    const response = await apiClient.post<Cheat>(`games/${gameUuid}/cheats`, request);
    return response.data;
  },

  async find(gameUuid: string): Promise<Cheat> {
    const response = await apiClient.get<Cheat>(`games/${gameUuid}/cheats`);
    return response.data;
  },

  async get(gameUuid: string, uuid: string): Promise<Cheat> {
    const response = await apiClient.get<Cheat>(`games/${gameUuid}/cheats/${uuid}`);
    return response.data;
  }

};
