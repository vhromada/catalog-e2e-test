import { apiClient } from '../ApiClient';
import type { Author } from './AuthorApi';

export interface Book {
  uuid: string;
  czechName: string;
  originalName: string;
  description: string;
  note?: string;
  authors: Author[];
  itemsCount: number;
}

export interface Statistics {
  count: number;
  itemsCount: number;
}

interface BookPage {
  data: Book[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeBookRequest {
  czechName: string;
  originalName: string;
  description: string;
  note?: string;
  authors: string[];
}

export const bookApi = {

  async create(request: ChangeBookRequest): Promise<Book> {
    const response = await apiClient.post<Book>('books', request);
    return response.data;
  },

  async get(uuid: string): Promise<Book> {
    const response = await apiClient.get<Book>(`books/${uuid}`);
    return response.data;
  },

  async search(czechName: string): Promise<Book[]> {
    const response = await apiClient.get<{ data: Book[] }>('books', {params: {czechName}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<BookPage> {
    const response = await apiClient.get<BookPage>('books', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('books/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`books/${uuid}`);
  },

  async deleteByCzechName(czechName: string): Promise<void> {
    const books = await this.search(czechName);
    await Promise.all(books.map((book) => this.delete(book.uuid)));
  }

};
