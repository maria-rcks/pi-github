import type { ChangeRef, Entity, ImageRef, ThreadItem } from "../types";
import { formatKindLabel, formatSimpleDate, mdEscape } from "../utils/text";
import { parseImagesFromMarkdown, replaceImagesWithTags } from "../utils/images";

type RenderThreadParams = {
	entity: Entity;
	owner: string;
	repo: string;
	number: number;
	page: number;
	perPage: number;
	items: ThreadItem[];
	images: ImageRef[];
	changes?: ChangeRef[];
};

export function renderThreadMarkdown(params: RenderThreadParams): string {
	const { entity, owner, repo, number, page, perPage, items, images, changes } = params;
	const total = items.length;
	const totalPages = Math.max(1, Math.ceil(total / perPage));
	const normalizedPage = Math.min(Math.max(1, page), totalPages);
	const start = (normalizedPage - 1) * perPage;
	const paged = items.slice(start, start + perPage);

	const lines: string[] = [];
	lines.push(`# ${entity.toUpperCase()} ${owner}/${repo}#${number}`);
	lines.push(`(${start + 1}-${Math.min(start + perPage, total)} of ${total}, page ${normalizedPage}/${totalPages})`);
	lines.push("");

	for (const [index, item] of paged.entries()) {
		const n = start + index + 1;
		lines.push(`## ${n}. ${formatKindLabel(item.kind)} | ${mdEscape(item.author)} <@${mdEscape(item.author)}> (${formatSimpleDate(item.createdAt)})`);
		lines.push("");
		const body = replaceImagesWithTags(item.body, images);
		lines.push(body || "_No body text_");
		lines.push("");
	}

	const pageImageSet = new Set<number>();
	for (const item of paged) {
		for (const image of parseImagesFromMarkdown(item.body)) {
			const match = images.find((candidate) => candidate.url === image.url);
			if (match) pageImageSet.add(match.id);
		}
	}

	if (pageImageSet.size > 0) {
		lines.push("## Images in this page");
		lines.push("");
		for (const id of [...pageImageSet].sort((a, b) => a - b)) {
			const image = images.find((candidate) => candidate.id === id);
			if (!image) continue;
			lines.push(`- image #${image.id}: ${image.url}`);
		}
		lines.push("");
		lines.push("Use action=download_image with imageId to download to /tmp.");
		lines.push("");
	}

	if (entity === "pr" && Array.isArray(changes)) {
		appendPrChangesSummary(lines, changes);
	}

	return lines.join("\n").trim();
}

function appendPrChangesSummary(lines: string[], changes: ChangeRef[]): void {
	if (changes.length === 0) return;
	lines.push("## Changed files");
	lines.push("");
	for (const change of changes) {
		const patchState = change.patch ? "patch available" : "patch unavailable";
		lines.push(`- change #${change.id}: ${change.filename} (${change.status}, +${change.additions} -${change.deletions}, ${patchState})`);
	}
	lines.push("");
	lines.push("Use action=get_change with changeId (or patchId/codeId) to retrieve the diff for one file.");
	lines.push("");
}
