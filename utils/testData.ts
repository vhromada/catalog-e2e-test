import { randomBytes, randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { requireEnv } from '../api/ApiClient';
import type { Credentials } from '../api/resources/AccountApi';
import type { Author, ChangeAuthorRequest } from '../api/resources/AuthorApi';
import type { ChangeBookRequest } from '../api/resources/BookApi';
import type { ChangeBookItemRequest } from '../api/resources/BookItemApi';
import type { ChangeCheatRequest } from '../api/resources/CheatApi';
import type { ChangeEpisodeRequest } from '../api/resources/EpisodeApi';
import type { ChangeGameRequest } from '../api/resources/GameApi';
import type { ChangeGenreRequest } from '../api/resources/GenreApi';
import type { ChangeJokeRequest } from '../api/resources/JokeApi';
import type { ChangeMovieRequest } from '../api/resources/MovieApi';
import type { ChangeMusicRequest } from '../api/resources/MusicApi';
import type { ChangeProgramRequest } from '../api/resources/ProgramApi';
import type { ChangeSeasonRequest } from '../api/resources/SeasonApi';
import type { ChangeShowRequest } from '../api/resources/ShowApi';
import type { ChangeSongRequest } from '../api/resources/SongApi';

export const ITEMS_PER_PAGE = Number(requireEnv('ITEMS_PER_PAGE'));

export const INVALID_UUID = '00000000-0000-0000-0000-000000000000';

export function pagesCount(count: number): number {
  return Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));
}

export function uniqueName(prefix: string): string {
  return `${prefix} E2E ${randomUUID()}`;
}

function shortId(): string {
  return randomUUID().slice(0, 8);
}

export function credentials(overrides: Partial<Credentials> = {}): Credentials {
  return {
    username: `user-${shortId()}`,
    password: 'Passw0rd!',
    ...overrides
  };
}

export function authorRequest(overrides: Partial<ChangeAuthorRequest> = {}): ChangeAuthorRequest {
  return {
    firstName: 'E2E',
    lastName: uniqueName('Author'),
    ...overrides
  };
}

export function authorListText(author: Omit<Author, 'uuid'>): string {
  return [author.firstName, author.middleName, author.lastName].filter(Boolean).join(' ');
}

export function bookRequest(authors: string[], overrides: Partial<ChangeBookRequest> = {}): ChangeBookRequest {
  return {
    czechName: uniqueName('Book CZ'),
    originalName: uniqueName('Book EN'),
    description: uniqueName('Description'),
    authors,
    ...overrides
  };
}

export function bookItemRequest(overrides: Partial<ChangeBookItemRequest> = {}): ChangeBookItemRequest {
  return {
    languages: ['EN'],
    format: 'PAPER',
    ...overrides
  };
}

export function cheatRequest(overrides: Partial<ChangeCheatRequest> = {}): ChangeCheatRequest {
  return {
    data: [{action: 'Action', description: 'Description'}],
    ...overrides
  };
}

export function episodeRequest(overrides: Partial<ChangeEpisodeRequest> = {}): ChangeEpisodeRequest {
  return {
    number: 1,
    name: uniqueName('Episode'),
    length: 60,
    ...overrides
  };
}

export function gameRequest(overrides: Partial<ChangeGameRequest> = {}): ChangeGameRequest {
  return {
    name: uniqueName('Game'),
    mediaCount: 1,
    format: 'ISO',
    crack: false,
    serialKey: false,
    patch: false,
    trainer: false,
    trainerData: false,
    editor: false,
    saves: false,
    ...overrides
  };
}

export function genreRequest(overrides: Partial<ChangeGenreRequest> = {}): ChangeGenreRequest {
  return {
    name: uniqueName('Genre'),
    ...overrides
  };
}

export function jokeRequest(overrides: Partial<ChangeJokeRequest> = {}): ChangeJokeRequest {
  return {
    content: uniqueName('Joke'),
    ...overrides
  };
}

export function jokeListText(content: string): string {
  return content.replace(/\n/g, ' ').slice(0, 100);
}

export function movieRequest(genres: string[], overrides: Partial<ChangeMovieRequest> = {}): ChangeMovieRequest {
  return {
    czechName: uniqueName('Movie CZ'),
    originalName: uniqueName('Movie EN'),
    year: 2000,
    languages: ['EN'],
    subtitles: [],
    media: [60],
    genres,
    ...overrides
  };
}

export function musicRequest(overrides: Partial<ChangeMusicRequest> = {}): ChangeMusicRequest {
  return {
    name: uniqueName('Music'),
    mediaCount: 1,
    ...overrides
  };
}

function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

export function pictureContent(size?: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 2;
  const pixel = Buffer.from([0, randomBytes(1)[0], randomBytes(1)[0], randomBytes(1)[0]]);
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    pngChunk('IHDR', header),
    pngChunk('tEXt', Buffer.from(`Comment\0${randomUUID()}`, 'latin1')),
    pngChunk('IDAT', deflateSync(pixel)),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
  return size && size > png.length ? Buffer.concat([png, Buffer.alloc(size - png.length)]) : png;
}

export function programRequest(overrides: Partial<ChangeProgramRequest> = {}): ChangeProgramRequest {
  return {
    name: uniqueName('Program'),
    mediaCount: 1,
    format: 'ISO',
    crack: false,
    serialKey: false,
    ...overrides
  };
}

export function seasonRequest(overrides: Partial<ChangeSeasonRequest> = {}): ChangeSeasonRequest {
  const year = new Date().getFullYear();
  return {
    number: 1,
    startYear: year,
    endYear: year,
    language: 'EN',
    subtitles: [],
    ...overrides
  };
}

export function showRequest(genres: string[], overrides: Partial<ChangeShowRequest> = {}): ChangeShowRequest {
  return {
    czechName: uniqueName('Show CZ'),
    originalName: uniqueName('Show EN'),
    genres,
    ...overrides
  };
}

export function songRequest(overrides: Partial<ChangeSongRequest> = {}): ChangeSongRequest {
  return {
    name: uniqueName('Song'),
    length: 60,
    ...overrides
  };
}
