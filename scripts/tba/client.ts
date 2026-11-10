import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const TBA_BASE = 'https://www.thebluealliance.com/api/v3';

export interface TbaClientOptions {
  authKey: string;
  cacheDir: string;
  minIntervalMs?: number;
  userAgent?: string;
}

export class TbaClient {
  private readonly authKey: string;
  private readonly cacheDir: string;
  private readonly minIntervalMs: number;
  private readonly userAgent: string;
  private lastRequestAt = 0;

  constructor(options: TbaClientOptions) {
    this.authKey = options.authKey;
    this.cacheDir = options.cacheDir;
    this.minIntervalMs = options.minIntervalMs ?? 80;
    this.userAgent = options.userAgent ?? 'frc-aides-tree-of-defeat';
    mkdirSync(this.cacheDir, { recursive: true });
  }

  private cachePath(route: string): string {
    const hash = createHash('sha1').update(route).digest('hex');
    return path.join(this.cacheDir, `${hash}.json`);
  }

  private async throttle() {
    const wait = this.minIntervalMs - (Date.now() - this.lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequestAt = Date.now();
  }

  async getJson<T>(route: string): Promise<T> {
    const file = this.cachePath(route);
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, 'utf8')) as T;
    }

    await this.throttle();
    const res = await fetch(`${TBA_BASE}${route}`, {
      headers: {
        'X-TBA-Auth-Key': this.authKey,
        Accept: 'application/json',
        'User-Agent': this.userAgent,
      },
    });
    if (!res.ok) {
      throw new Error(`TBA ${route} → ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as T;
    writeFileSync(file, JSON.stringify(data));
    return data;
  }
}

export function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

export function yearRange(from: number, to: number): number[] {
  const years: number[] = [];
  for (let y = from; y <= to; y++) years.push(y);
  return years;
}
