import { mkdir, readFile, readdir, rm, stat, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import type { Entity, ThreadCacheEntry, ThreadItem } from "../types";

const DEFAULT_CACHE_DIR = join(homedir(), ".pi", "cache", "github-tool");
const DEFAULT_CACHE_VERSION = "v2";
const DEFAULT_MAX_CACHE_ENTRIES = 300;

export class ThreadCache {
	private readonly threadCache = new Map<string, ThreadCacheEntry>();

	constructor(
		private readonly cacheDir = DEFAULT_CACHE_DIR,
		private readonly cacheVersion = DEFAULT_CACHE_VERSION,
		private readonly maxCacheEntries = DEFAULT_MAX_CACHE_ENTRIES,
	) {}

	async get(
		entity: Entity,
		owner: string,
		repo: string,
		number: number,
		fetcher: () => Promise<ThreadItem[]>,
	): Promise<ThreadItem[]> {
		const key = this.cacheKey(entity, owner, repo, number);
		const memoryCached = this.threadCache.get(key);
		if (memoryCached) {
			return memoryCached.items;
		}

		const diskCached = await this.readDiskCache(key);
		if (diskCached) {
			this.threadCache.set(key, diskCached);
			this.pruneMemoryCache();
			return diskCached.items;
		}

		const entry: ThreadCacheEntry = {
			items: await fetcher(),
			cachedAt: Date.now(),
		};
		this.threadCache.set(key, entry);
		this.pruneMemoryCache();
		await this.writeDiskCache(key, entry);
		return entry.items;
	}

	private cacheKey(entity: Entity, owner: string, repo: string, number: number): string {
		return `${this.cacheVersion}:${entity}:${owner}/${repo}#${number}`;
	}

	private cacheFileForKey(key: string): string {
		return join(this.cacheDir, `${encodeURIComponent(key)}.json`);
	}

	private async readDiskCache(key: string): Promise<ThreadCacheEntry | null> {
		try {
			const raw = await readFile(this.cacheFileForKey(key), "utf8");
			const parsed = JSON.parse(raw) as Partial<ThreadCacheEntry>;
			if (!parsed || !Array.isArray(parsed.items)) return null;
			return {
				items: parsed.items,
				cachedAt: typeof parsed.cachedAt === "number" ? parsed.cachedAt : 0,
			};
		} catch {
			return null;
		}
	}

	private async writeDiskCache(key: string, entry: ThreadCacheEntry): Promise<void> {
		try {
			await mkdir(this.cacheDir, { recursive: true });
			await writeFile(this.cacheFileForKey(key), JSON.stringify(entry));
			await this.pruneDiskCache();
		} catch {
			// Ignore cache write failures.
		}
	}

	private async pruneDiskCache(): Promise<void> {
		try {
			await mkdir(this.cacheDir, { recursive: true });
			const names = await readdir(this.cacheDir);
			if (names.length <= this.maxCacheEntries) return;

			const files = await Promise.all(
				names.map(async (name) => {
					const file = join(this.cacheDir, name);
					const info = await stat(file);
					return { file, mtimeMs: info.mtimeMs };
				}),
			);

			files.sort((a, b) => b.mtimeMs - a.mtimeMs);
			for (const file of files.slice(this.maxCacheEntries)) {
				await rm(file.file, { force: true });
			}
		} catch {
			// Ignore cache prune failures.
		}
	}

	private pruneMemoryCache(): void {
		if (this.threadCache.size <= this.maxCacheEntries) return;

		const entries = [...this.threadCache.entries()].sort((a, b) => (b[1].cachedAt ?? 0) - (a[1].cachedAt ?? 0));
		this.threadCache.clear();
		for (const [key, value] of entries.slice(0, this.maxCacheEntries)) {
			this.threadCache.set(key, value);
		}
	}
}
