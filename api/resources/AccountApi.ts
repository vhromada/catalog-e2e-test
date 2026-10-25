import { hashSync } from 'bcrypt-ts';
import { apiClient, requireEnv } from '../ApiClient';

export interface Account {
  uuid: string;
  username: string;
  locked: boolean;
  roles: string[];
}

export interface Credentials {
  username: string;
  password: string;
}

function withHashedPassword(credentials: Credentials): Credentials {
  return {...credentials, password: hashSync(credentials.password, requireEnv('HASH_SALT'))};
}

export interface Statistics {
  count: number;
}

interface AccountPage {
  data: Account[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export const ROLE_ADMIN = 'ROLE_ADMIN';
export const ROLE_USER = 'ROLE_USER';

export const accountApi = {

  async registerCredentials(credentials: Credentials): Promise<Account> {
    const response = await apiClient.post<Account>('accounts/credentials', withHashedPassword(credentials));
    return response.data;
  },

  async get(uuid: string): Promise<Account> {
    const response = await apiClient.get<Account>(`accounts/${uuid}`);
    return response.data;
  },

  async search(username: string): Promise<Account[]> {
    const response = await apiClient.get<{ data: Account[] }>('accounts', {params: {username}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<AccountPage> {
    const response = await apiClient.get<AccountPage>('accounts', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('accounts/statistics');
    return response.data;
  },

  async updateRoles(uuid: string, roles: string[]): Promise<Account> {
    const response = await apiClient.put<Account>(`accounts/${uuid}/roles`, {roles});
    return response.data;
  },

  async checkCredentials(credentials: Credentials): Promise<Account> {
    const response = await apiClient.post<Account>('accounts/credentials/check', withHashedPassword(credentials));
    return response.data;
  }

};
