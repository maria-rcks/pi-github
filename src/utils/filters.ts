import type { ThreadItem } from "../types";

export type ThreadFilters = {
	author?: string;
	kind?: string;
	since?: string;
	until?: string;
	contains?: string;
};

function toEpoch(raw?: string): number | undefined {
	if (!raw) return undefined;
	const ms = Date.parse(raw);
	return Number.isFinite(ms) ? ms : undefined;
}

export function applyThreadFilters(items: ThreadItem[], filters: ThreadFilters): ThreadItem[] {
	const author = filters.author?.trim().toLowerCase();
	const kind = filters.kind?.trim().toLowerCase();
	const contains = filters.contains?.trim().toLowerCase();
	const since = toEpoch(filters.since);
	const until = toEpoch(filters.until);

	return items.filter((item) => {
		if (author && item.author.toLowerCase() !== author) return false;
		if (kind && item.kind.toLowerCase() !== kind) return false;
		if (contains && !item.body.toLowerCase().includes(contains)) return false;

		if (since !== undefined || until !== undefined) {
			const at = Date.parse(item.createdAt);
			if (!Number.isFinite(at)) return false;
			if (since !== undefined && at < since) return false;
			if (until !== undefined && at > until) return false;
		}

		return true;
	});
}
