import { apiClient } from '../ApiClient';

export interface BookItem {
  uuid: string;
  languages: string[];
  format: string;
  note?: string;
}

interface BookItemPage {
  data: BookItem[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeBookItemRequest {
  languages: string[];
  format: string;
  note?: string;
}

export const bookItemApi = {

  async create(bookUuid: string, request: ChangeBookItemRequest): Promise<BookItem> {
    const response = await apiClient.post<BookItem>(`books/${bookUuid}/items`, request);
    return response.data;
  },

  async get(bookUuid: string, uuid: string): Promise<BookItem> {
    const response = await apiClient.get<BookItem>(`books/${bookUuid}/items/${uuid}`);
    return response.data;
  },

  async list(bookUuid: string, page = 1, limit = 50): Promise<BookItemPage> {
    const response = await apiClient.get<BookItemPage>(`books/${bookUuid}/items`, {params: {page, limit}});
    return response.data;
  },

  async delete(bookUuid: string, uuid: string): Promise<void> {
    await apiClient.delete(`books/${bookUuid}/items/${uuid}`);
  }

};
