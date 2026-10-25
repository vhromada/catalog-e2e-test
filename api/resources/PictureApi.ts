import { isAxiosError } from 'axios';
import { apiClient } from '../ApiClient';

interface PicturePage {
  data: string[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export const pictureApi = {

  async create(content: Buffer): Promise<void> {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(content)]), 'picture.png');
    await apiClient.post('pictures', form);
  },

  /** Creates a picture and returns its UUID (the BE does not return it, so the picture is found by its unique content). */
  async createAndFind(content: Buffer): Promise<string> {
    await this.create(content);
    const uuids = await this.findByContent(content);
    if (uuids.length !== 1) {
      throw new Error(`Expected exactly one created picture, found ${uuids.length}`);
    }
    return uuids[0];
  },

  async get(uuid: string): Promise<Buffer> {
    const response = await apiClient.get<ArrayBuffer>(`pictures/${uuid}`, {responseType: 'arraybuffer'});
    return Buffer.from(response.data);
  },

  async list(page: number, limit = 50): Promise<PicturePage> {
    const response = await apiClient.get<PicturePage>('pictures', {params: {page, limit}});
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`pictures/${uuid}`);
  },

  async findByContent(content: Buffer): Promise<string[]> {
    const found: string[] = [];
    let page = 1;
    let pagesCount = 1;
    while (page <= pagesCount) {
      const result = await this.list(page);
      pagesCount = result.pagingInfo.pagesCount;
      for (const uuid of result.data) {
        try {
          if ((await this.get(uuid)).equals(content)) {
            found.push(uuid);
          }
        } catch (error) {
          // The DB is shared with tests running in parallel, so a listed picture may have been removed in the meantime.
          if (!isAxiosError(error) || error.response?.status !== 404) {
            throw error;
          }
        }
      }
      page++;
    }
    return found;
  },

  async deleteByContent(content: Buffer): Promise<void> {
    const uuids = await this.findByContent(content);
    await Promise.all(uuids.map((uuid) => this.delete(uuid)));
  }

};
