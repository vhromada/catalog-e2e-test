import { apiClient } from '../ApiClient';

export interface Joke {
  uuid: string;
  content: string;
}

export interface ChangeJokeRequest {
  content: string;
}

export interface Statistics {
  count: number;
}

interface JokePage {
  data: Joke[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export const jokeApi = {

  async create(request: ChangeJokeRequest): Promise<Joke> {
    const response = await apiClient.post<Joke>('jokes', request);
    return response.data;
  },

  async get(uuid: string): Promise<Joke> {
    const response = await apiClient.get<Joke>(`jokes/${uuid}`);
    return response.data;
  },

  async list(page: number, limit = 50): Promise<JokePage> {
    const response = await apiClient.get<JokePage>('jokes', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('jokes/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`jokes/${uuid}`);
  },

  async findByContent(content: string): Promise<Joke[]> {
    const found: Joke[] = [];
    let page = 1;
    let pagesCount = 1;
    while (page <= pagesCount) {
      const result = await this.list(page);
      pagesCount = result.pagingInfo.pagesCount;
      found.push(...result.data.filter((joke) => joke.content.includes(content)));
      page++;
    }
    return found;
  },

  async deleteByContent(content: string): Promise<void> {
    const jokes = await this.findByContent(content);
    await Promise.all(jokes.map((joke) => this.delete(joke.uuid)));
  }

};
