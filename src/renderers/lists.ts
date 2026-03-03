import type { ChangeRef, Entity, ImageRef, ParticipantRef, PrCheckRef, PrCommitDetail, PrCommitRef, PrOverview, ReviewCommentRef } from "../types";
import { formatSimpleDate, safeIso } from "../utils/text";

export function renderImagesListMarkdown(entity: Entity, owner: string, repo: string, number: number, images: ImageRef[]): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push(`entity: ${entity}`);
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${number}`);
	lines.push(`total_images: ${images.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Images for ${entity.toUpperCase()} ${owner}/${repo}#${number}`);
	lines.push("");

	if (images.length === 0) {
		lines.push("No images found.");
	} else {
		for (const image of images) {
			lines.push(`- image #${image.id}: ${image.url}`);
		}
	}

	return lines.join("\n");
}

export function renderChangesListMarkdown(owner: string, repo: string, number: number, changes: ChangeRef[]): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: pr");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${number}`);
	lines.push(`total_changes: ${changes.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Changes for PR ${owner}/${repo}#${number}`);
	lines.push("");

	if (changes.length === 0) {
		lines.push("No changed files found.");
	} else {
		for (const change of changes) {
			const patchState = change.patch ? "patch available" : "patch unavailable";
			lines.push(`- change #${change.id}: ${change.filename} (${change.status}, +${change.additions} -${change.deletions}, ${patchState})`);
		}
		lines.push("");
		lines.push("Use action=get_change with changeId (or patchId/codeId) to retrieve a file diff.");
	}

	return lines.join("\n");
}

export function renderIssuesListMarkdown(owner: string, repo: string, page: number, perPage: number, issues: any[]): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: issue");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`page: ${page}`);
	lines.push(`per_page: ${perPage}`);
	lines.push(`items_on_page: ${issues.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Issues for ${owner}/${repo}`);
	lines.push("");

	if (issues.length === 0) {
		lines.push("No issues found on this page.");
	} else {
		for (const issue of issues) {
			const number = Number(issue.number ?? 0);
			const state = String(issue.state ?? "unknown");
			const title = String(issue.title ?? "(no title)").replace(/\r?\n/g, " ").trim();
			const author = String(issue.user?.login ?? "unknown");
			const updated = safeIso(issue.updated_at);
			const url = String(issue.html_url ?? "");
			lines.push(`- #${number} [${state}] ${title} (@${author}, updated ${formatSimpleDate(updated)})${url ? ` - ${url}` : ""}`);
		}
	}

	return lines.join("\n");
}

export function renderPrsListMarkdown(owner: string, repo: string, page: number, perPage: number, prs: any[]): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: pr");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`page: ${page}`);
	lines.push(`per_page: ${perPage}`);
	lines.push(`items_on_page: ${prs.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Pull requests for ${owner}/${repo}`);
	lines.push("");

	if (prs.length === 0) {
		lines.push("No pull requests found on this page.");
	} else {
		for (const pr of prs) {
			const number = Number(pr.number ?? 0);
			const state = String(pr.state ?? "unknown");
			const title = String(pr.title ?? "(no title)").replace(/\r?\n/g, " ").trim();
			const author = String(pr.user?.login ?? "unknown");
			const updated = safeIso(pr.updated_at);
			const draft = pr.draft ? " draft" : "";
			const url = String(pr.html_url ?? "");
			lines.push(`- #${number} [${state}${draft}] ${title} (@${author}, updated ${formatSimpleDate(updated)})${url ? ` - ${url}` : ""}`);
		}
	}

	return lines.join("\n");
}

export function renderPrCommitsMarkdown(owner: string, repo: string, number: number, commits: PrCommitRef[]): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: pr");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${number}`);
	lines.push(`total_commits: ${commits.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Commits for PR ${owner}/${repo}#${number}`);
	lines.push("");

	if (commits.length === 0) {
		lines.push("No commits found.");
	} else {
		for (const commit of commits) {
			lines.push(`- ${commit.sha.slice(0, 7)} @${commit.author} (${formatSimpleDate(commit.date)}) ${commit.message}${commit.url ? ` - ${commit.url}` : ""}`);
		}
	}

	return lines.join("\n");
}

export function renderPrCommitMarkdown(owner: string, repo: string, number: number, commit: PrCommitDetail): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: pr");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${number}`);
	lines.push(`commit: ${commit.sha}`);
	lines.push(`author: ${commit.author}`);
	lines.push(`date: ${commit.date}`);
	lines.push(`files_changed: ${commit.changes.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Commit ${commit.sha.slice(0, 7)} for PR ${owner}/${repo}#${number}`);
	lines.push("");
	lines.push(commit.message || "(no message)");
	lines.push("");

	for (const change of commit.changes) {
		lines.push(`## ${change.filename} (${change.status}, +${change.additions} -${change.deletions})`);
		if (change.patch) {
			lines.push("```diff");
			lines.push(change.patch);
			lines.push("```");
		} else {
			lines.push("_Patch unavailable_");
		}
		lines.push("");
	}

	return lines.join("\n").trim();
}

export function renderPrChecksMarkdown(owner: string, repo: string, number: number, checks: PrCheckRef[]): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: pr");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${number}`);
	lines.push(`total_checks: ${checks.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Checks for PR ${owner}/${repo}#${number}`);
	lines.push("");

	if (checks.length === 0) {
		lines.push("No check runs found.");
	} else {
		for (const check of checks) {
			const outcome = check.conclusion ? `${check.status}/${check.conclusion}` : check.status;
			lines.push(`- ${check.name}: ${outcome}${check.url ? ` - ${check.url}` : ""}`);
		}
	}

	return lines.join("\n");
}

export function renderFileMarkdown(owner: string, repo: string, path: string, content: string, startLine = 1, endLine?: number): string {
	const lines = content.split("\n");
	const startIndex = Math.max(0, startLine - 1);
	const endIndex = typeof endLine === "number" ? Math.max(startIndex, endLine) : lines.length;
	const selected = lines.slice(startIndex, endIndex);
	const numbered = selected.map((line, index) => `${startLine + index}: ${line}`);

	return [
		"---",
		`repo: ${owner}/${repo}`,
		`path: ${path}`,
		`lines: ${numbered.length}`,
		"---",
		"",
		numbered.join("\n"),
	]
		.join("\n")
		.trim();
}

export function renderPrOverviewMarkdown(owner: string, repo: string, overview: PrOverview): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: pr");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${overview.number}`);
	lines.push(`state: ${overview.state}`);
	lines.push(`draft: ${overview.draft}`);
	lines.push(`head_sha: ${overview.headSha}`);
	lines.push("---");
	lines.push("");
	lines.push(`# PR ${owner}/${repo}#${overview.number}: ${overview.title}`);
	lines.push("");
	lines.push(`- Author: @${overview.author}`);
	lines.push(`- State: ${overview.state}${overview.draft ? " (draft)" : ""}`);
	if (overview.baseRef || overview.headRef) {
		lines.push(`- Branches: ${overview.headRef ?? "?"} -> ${overview.baseRef ?? "?"}`);
	}
	if (overview.url) lines.push(`- URL: ${overview.url}`);
	lines.push("");

	if (overview.reviewCounts) {
		const entries = Object.entries(overview.reviewCounts).sort((a, b) => b[1] - a[1]);
		lines.push("## Reviews");
		if (entries.length === 0) lines.push("- No reviews yet.");
		for (const [state, count] of entries) {
			lines.push(`- ${state}: ${count}`);
		}
		lines.push("");
	}

	if (overview.checks) {
		lines.push("## Checks");
		if (overview.checks.length === 0) {
			lines.push("- No check runs found.");
		} else {
			for (const check of overview.checks) {
				const outcome = check.conclusion ? `${check.status}/${check.conclusion}` : check.status;
				lines.push(`- ${check.name}: ${outcome}`);
			}
		}
		lines.push("");
	}

	if (overview.changes) {
		lines.push("## Changed files");
		if (overview.changes.length === 0) {
			lines.push("- No file changes.");
		} else {
			for (const change of overview.changes.slice(0, 20)) {
				lines.push(`- #${change.id}: ${change.filename} (${change.status}, +${change.additions} -${change.deletions})`);
			}
			if (overview.changes.length > 20) {
				lines.push(`- ... ${overview.changes.length - 20} more files`);
			}
		}
		lines.push("");
	}

	return lines.join("\n").trim();
}

export function renderReviewCommentsMarkdown(owner: string, repo: string, number: number, comments: ReviewCommentRef[]): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: pr");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${number}`);
	lines.push(`total_review_comments: ${comments.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Review comments for PR ${owner}/${repo}#${number}`);
	lines.push("");

	if (comments.length === 0) {
		lines.push("No review comments found.");
	} else {
		for (const comment of comments) {
			const location = comment.path ? `${comment.path}${typeof comment.line === "number" ? `:${comment.line}` : ""}` : "unknown";
			const body = comment.body.replace(/\r?\n/g, " ").trim();
			const compactBody = body.length > 120 ? `${body.slice(0, 117)}...` : body;
			lines.push(
				`- #${comment.id} @${comment.author} (${formatSimpleDate(comment.createdAt)}) [${location}] ${compactBody}${comment.url ? ` - ${comment.url}` : ""}`,
			);
		}
	}

	return lines.join("\n");
}

export function renderParticipantsMarkdown(
	entity: Entity,
	owner: string,
	repo: string,
	number: number,
	participants: ParticipantRef[],
): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push(`entity: ${entity}`);
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${number}`);
	lines.push(`total_participants: ${participants.length}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Participants for ${entity.toUpperCase()} ${owner}/${repo}#${number}`);
	lines.push("");

	if (participants.length === 0) {
		lines.push("No participants found.");
	} else {
		for (const participant of participants) {
			lines.push(`- @${participant.login} (${participant.roles.join(", ")}, ${participant.count} entries)`);
		}
	}

	return lines.join("\n");
}

export function renderChangeMarkdown(owner: string, repo: string, number: number, change: ChangeRef): string {
	const lines: string[] = [];
	lines.push("---");
	lines.push("entity: pr");
	lines.push(`repo: ${owner}/${repo}`);
	lines.push(`number: ${number}`);
	lines.push(`change_id: ${change.id}`);
	lines.push(`file: ${change.filename}`);
	lines.push(`status: ${change.status}`);
	lines.push(`additions: ${change.additions}`);
	lines.push(`deletions: ${change.deletions}`);
	lines.push(`changes: ${change.changes}`);
	if (change.previousFilename) lines.push(`previous_file: ${change.previousFilename}`);
	if (change.blobUrl) lines.push(`blob_url: ${change.blobUrl}`);
	if (change.rawUrl) lines.push(`raw_url: ${change.rawUrl}`);
	lines.push("---");
	lines.push("");
	lines.push(`# Change #${change.id}: ${change.filename}`);
	lines.push("");

	if (!change.patch) {
		lines.push("Diff patch is not available for this file (likely binary, deleted large file, or truncated by GitHub API).");
		return lines.join("\n");
	}

	lines.push("```diff");
	lines.push(change.patch);
	lines.push("```");
	return lines.join("\n");
}
