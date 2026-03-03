import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { basename, join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { GithubParams } from "./schema";
import type { Action, Entity } from "./types";
import { ThreadCache } from "./cache/thread-cache";
import { createGitHubClient } from "./github/client";
import { fetchPrChanges, fetchReviewComments, fetchThread } from "./github/fetchers";
import { inferEntity, resolveRepo } from "./github/repo";
import { renderThreadMarkdown } from "./renderers/thread";
import {
	renderChangeMarkdown,
	renderChangesListMarkdown,
	renderImagesListMarkdown,
	renderIssuesListMarkdown,
	renderParticipantsMarkdown,
	renderPrsListMarkdown,
	renderReviewCommentsMarkdown,
} from "./renderers/lists";
import { applyThreadFilters } from "./utils/filters";
import { collectImages, imageExtFromUrl } from "./utils/images";
import { collectParticipants } from "./utils/participants";

export default function githubExtension(pi: ExtensionAPI) {
	const threadCache = new ThreadCache();
	const client = createGitHubClient(pi);

	async function fetchThreadCached(entity: Entity, owner: string, repo: string, number: number) {
		return threadCache.get(entity, owner, repo, number, () => fetchThread(client, entity, owner, repo, number));
	}

	async function downloadImage(entity: Entity, owner: string, repo: string, number: number, imageId: number, tmpDir = "/tmp"): Promise<string> {
		const items = await fetchThreadCached(entity, owner, repo, number);
		const images = collectImages(items);
		const image = images.find((candidate) => candidate.id === imageId);
		if (!image) throw new Error(`imageId ${imageId} not found`);

		await mkdir(tmpDir, { recursive: true });
		let token = "";
		try {
			token = (await client.ghText(["auth", "token"]))?.trim() ?? "";
		} catch {
			token = "";
		}

		const response = await fetch(image.url, {
			headers: token
				? {
					Authorization: `Bearer ${token}`,
					"User-Agent": "pi-github-tool",
				}
				: { "User-Agent": "pi-github-tool" },
		});
		if (!response.ok) {
			throw new Error(`failed to download image: HTTP ${response.status}`);
		}

		const bytes = new Uint8Array(await response.arrayBuffer());
		const ext = imageExtFromUrl(image.url);
		const file = join(tmpDir, `github-${owner}-${repo}-${entity}-${number}-image-${imageId}${ext}`);
		await writeFile(file, bytes);

		const lines = [
			"---",
			`entity: ${entity}`,
			`repo: ${owner}/${repo}`,
			`number: ${number}`,
			`image_id: ${imageId}`,
			`downloaded_to: ${file}`,
			`source_url: ${image.url}`,
			"---",
			"",
			`Downloaded image #${imageId} to: ${file}`,
			`File name: ${basename(file)}`,
		];
		return lines.join("\n");
	}

	pi.registerTool({
		name: "github",
		label: "GitHub Markdown",
		description:
			"Formats GitHub threads as chronological markdown. Supports list_issues/list_prs, issue/PR/discussion auto-detection, image IDs + download, and PR file-change IDs + per-file diff retrieval.",
		parameters: GithubParams,
		async execute(_toolCallId, rawParams) {
			const action: Action = (rawParams.action as Action | undefined) ?? "format";
			const page = Number(rawParams.page ?? 1);
			const perPage = Number(rawParams.perPage ?? 20);
			const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
			const normalizedPerPage = Number.isInteger(perPage) && perPage > 0 ? Math.min(perPage, 100) : 20;

			try {
				const { owner, repo } = await resolveRepo(pi, rawParams.owner, rawParams.repo);

				if (action === "list_issues") {
					const rows = await client.fetchRestPage(
						`/repos/${owner}/${repo}/issues?state=open&sort=updated&direction=desc`,
						normalizedPage,
						normalizedPerPage,
					);
					const issues = rows.filter((row) => !row?.pull_request);
					const text = renderIssuesListMarkdown(owner, repo, normalizedPage, normalizedPerPage, issues);
					return { content: [{ type: "text", text }] };
				}

				if (action === "list_prs") {
					const prs = await client.fetchRestPage(
						`/repos/${owner}/${repo}/pulls?state=open&sort=updated&direction=desc`,
						normalizedPage,
						normalizedPerPage,
					);
					const text = renderPrsListMarkdown(owner, repo, normalizedPage, normalizedPerPage, prs);
					return { content: [{ type: "text", text }] };
				}

				const id = Number(rawParams.id ?? rawParams.number);
				if (!Number.isInteger(id) || id < 1) {
					return { content: [{ type: "text", text: "GitHub tool error: id must be an integer >= 1" }] };
				}

				const entity = (rawParams.entity as Entity | undefined) ?? (await inferEntity(client, owner, repo, id));

				if (action === "list_participants") {
					const items = await fetchThreadCached(entity, owner, repo, id);
					const participants = collectParticipants(items);
					const text = renderParticipantsMarkdown(entity, owner, repo, id, participants);
					return { content: [{ type: "text", text }] };
				}

				if (action === "list_images") {
					const items = await fetchThreadCached(entity, owner, repo, id);
					const images = collectImages(items);
					const text = renderImagesListMarkdown(entity, owner, repo, id, images);
					return { content: [{ type: "text", text }] };
				}

				if (action === "download_image") {
					if (!rawParams.imageId) {
						return {
							content: [{ type: "text", text: "Error: imageId is required for action=download_image" }],
						};
					}

					const text = await downloadImage(
						entity,
						owner,
						repo,
						id,
						Number(rawParams.imageId),
						typeof rawParams.tmpDir === "string" && rawParams.tmpDir.trim() ? rawParams.tmpDir : "/tmp",
					);
					return { content: [{ type: "text", text }] };
				}

				if (action === "list_changes") {
					if (entity !== "pr") {
						return { content: [{ type: "text", text: "Error: action=list_changes only works for pull requests" }] };
					}
					const changes = await fetchPrChanges(client, owner, repo, id);
					const text = renderChangesListMarkdown(owner, repo, id, changes);
					return { content: [{ type: "text", text }] };
				}

				if (action === "list_review_comments") {
					if (entity !== "pr") {
						return { content: [{ type: "text", text: "Error: action=list_review_comments only works for pull requests" }] };
					}
					const allComments = await fetchReviewComments(client, owner, repo, id);
					const authorFilter = typeof rawParams.author === "string" ? rawParams.author.trim().toLowerCase() : "";
					const pathFilter = typeof rawParams.path === "string" ? rawParams.path.trim() : "";
					const sinceMs = typeof rawParams.since === "string" ? Date.parse(rawParams.since) : NaN;
					const untilMs = typeof rawParams.until === "string" ? Date.parse(rawParams.until) : NaN;

					const filtered = allComments.filter((comment) => {
						if (authorFilter && comment.author.toLowerCase() !== authorFilter) return false;
						if (pathFilter && comment.path !== pathFilter) return false;
						if (Number.isFinite(sinceMs) || Number.isFinite(untilMs)) {
							const createdMs = Date.parse(comment.createdAt);
							if (!Number.isFinite(createdMs)) return false;
							if (Number.isFinite(sinceMs) && createdMs < sinceMs) return false;
							if (Number.isFinite(untilMs) && createdMs > untilMs) return false;
						}
						return true;
					});

					const start = (normalizedPage - 1) * normalizedPerPage;
					const pageComments = filtered.slice(start, start + normalizedPerPage);
					const text = renderReviewCommentsMarkdown(owner, repo, id, pageComments);
					return { content: [{ type: "text", text }] };
				}

				if (action === "get_change") {
					if (entity !== "pr") {
						return { content: [{ type: "text", text: "Error: action=get_change only works for pull requests" }] };
					}
					const requestedChangeId = Number(rawParams.changeId ?? rawParams.patchId ?? rawParams.codeId);
					if (!Number.isInteger(requestedChangeId) || requestedChangeId < 1) {
						return {
							content: [{ type: "text", text: "Error: changeId (or patchId/codeId) is required for action=get_change" }],
						};
					}
					const changes = await fetchPrChanges(client, owner, repo, id);
					const change = changes.find((candidate) => candidate.id === requestedChangeId);
					if (!change) {
						throw new Error(`changeId ${requestedChangeId} not found`);
					}

					const text = renderChangeMarkdown(owner, repo, id, change);
					return { content: [{ type: "text", text }] };
				}

				const items = await fetchThreadCached(entity, owner, repo, id);
				const filteredItems = applyThreadFilters(items, {
					author: typeof rawParams.author === "string" ? rawParams.author : undefined,
					kind: typeof rawParams.kind === "string" ? rawParams.kind : undefined,
					since: typeof rawParams.since === "string" ? rawParams.since : undefined,
					until: typeof rawParams.until === "string" ? rawParams.until : undefined,
					contains: typeof rawParams.contains === "string" ? rawParams.contains : undefined,
				});
				const images = collectImages(filteredItems);
				const changes = entity === "pr" ? await fetchPrChanges(client, owner, repo, id) : undefined;
				const text = renderThreadMarkdown({
					entity,
					owner,
					repo,
					number: id,
					page: normalizedPage,
					perPage: normalizedPerPage,
					items: filteredItems,
					images,
					changes,
					filteredFromTotal: items.length,
				});
				return { content: [{ type: "text", text }] };
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return { content: [{ type: "text", text: `GitHub tool error: ${message}` }] };
			}
		},
	});
}
