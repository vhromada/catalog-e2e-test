import { apiClient } from '../ApiClient';

export interface Program {
  uuid: string;
  name: string;
  wikiEn?: string;
  wikiCz?: string;
  mediaCount: number;
  format: string;
  crack: boolean;
  serialKey: boolean;
  otherData?: string;
  note?: string;
}

export interface Statistics {
  count: number;
  mediaCount: number;
}

interface ProgramPage {
  data: Program[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeProgramRequest {
  name: string;
  wikiEn?: string;
  wikiCz?: string;
  mediaCount: number;
  format: string;
  crack: boolean;
  serialKey: boolean;
  otherData?: string;
  note?: string;
}

export const programApi = {

  async create(request: ChangeProgramRequest): Promise<Program> {
    const response = await apiClient.post<Program>('programs', request);
    return response.data;
  },

  async get(uuid: string): Promise<Program> {
    const response = await apiClient.get<Program>(`programs/${uuid}`);
    return response.data;
  },

  async search(name: string): Promise<Program[]> {
    const response = await apiClient.get<{ data: Program[] }>('programs', {params: {name}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<ProgramPage> {
    const response = await apiClient.get<ProgramPage>('programs', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('programs/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`programs/${uuid}`);
  },

  async deleteByName(name: string): Promise<void> {
    const programs = await this.search(name);
    await Promise.all(programs.map((program) => this.delete(program.uuid)));
  }

};
