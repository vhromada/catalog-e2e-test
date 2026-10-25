import { apiClient } from '../ApiClient';

export interface Game {
  uuid: string;
  name: string;
  wikiEn?: string;
  wikiCz?: string;
  mediaCount: number;
  format: string;
  crack: boolean;
  serialKey: boolean;
  patch: boolean;
  trainer: boolean;
  trainerData: boolean;
  editor: boolean;
  saves: boolean;
  otherData?: string;
  note?: string;
  cheat: boolean;
}

export interface Statistics {
  count: number;
  mediaCount: number;
}

interface GamePage {
  data: Game[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeGameRequest {
  name: string;
  wikiEn?: string;
  wikiCz?: string;
  mediaCount: number;
  format: string;
  crack: boolean;
  serialKey: boolean;
  patch: boolean;
  trainer: boolean;
  trainerData: boolean;
  editor: boolean;
  saves: boolean;
  otherData?: string;
  note?: string;
}

export const gameApi = {

  async create(request: ChangeGameRequest): Promise<Game> {
    const response = await apiClient.post<Game>('games', request);
    return response.data;
  },

  async get(uuid: string): Promise<Game> {
    const response = await apiClient.get<Game>(`games/${uuid}`);
    return response.data;
  },

  async search(name: string): Promise<Game[]> {
    const response = await apiClient.get<{ data: Game[] }>('games', {params: {name}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<GamePage> {
    const response = await apiClient.get<GamePage>('games', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('games/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`games/${uuid}`);
  },

  async deleteByName(name: string): Promise<void> {
    const games = await this.search(name);
    await Promise.all(games.map((game) => this.delete(game.uuid)));
  }

};
