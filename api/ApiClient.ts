import axios, { type AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config({path: ['.env.local', '.env'], quiet: true});

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name} (set it in .env or .env.local)`);
  }
  return value;
}

const baseURL = `${process.env.BE_BASE_URL ?? 'http://localhost:8110'}/rest/`;

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
    auth: {
      username: requireEnv('CATALOG_USERNAME'),
      password: requireEnv('CATALOG_PASSWORD')
    }
  });
  client.interceptors.request.use((config) => {
    config.headers.set('X-Request-Id', randomUUID());
    return config;
  });
  return client;
}

export const apiClient = createApiClient();
