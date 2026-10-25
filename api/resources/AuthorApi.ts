import { apiClient } from '../ApiClient';

export interface Author {
  uuid: string;
  firstName: string;
  middleName?: string;
  lastName: string;
}

export interface Statistics {
  count: number;
}

interface AuthorPage {
  data: Author[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeAuthorRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
}

export interface AuthorFilter {
  firstName?: string;
  middleName?: string;
  lastName?: string;
}

export const authorApi = {

  async create(request: ChangeAuthorRequest): Promise<Author> {
    const response = await apiClient.post<Author>('authors', request);
    return response.data;
  },

  async get(uuid: string): Promise<Author> {
    const response = await apiClient.get<Author>(`authors/${uuid}`);
    return response.data;
  },

  async search(filter: AuthorFilter): Promise<Author[]> {
    const response = await apiClient.get<{ data: Author[] }>('authors', {params: filter});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<AuthorPage> {
    const response = await apiClient.get<AuthorPage>('authors', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('authors/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`authors/${uuid}`);
  },

  async deleteByLastName(lastName: string): Promise<void> {
    const authors = await this.search({lastName});
    await Promise.all(authors.map((author) => this.delete(author.uuid)));
  }

};
