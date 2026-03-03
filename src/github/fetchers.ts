import type { ChangeRef, Entity, PrCommitDetail, PrCommitRef, PrCheckRef, ReviewCommentRef, ThreadItem } from "../types";
import { safeIso, trimBody } from "../utils/text";
import type { GitHubClient } from "./client";

export async function fetchIssueThread(client: GitHubClient, owner: string, repo: string, number: number): Promise<ThreadItem[]> {
	const issue = await client.ghJson(["api", `/repos/${owner}/${repo}/issues/${number}`]);
	const comments = await client.fetchAllRestPages(`/repos/${owner}/${repo}/issues/${number}/comments`);
	const items: ThreadItem[] = [
		{
			kind: "issue",
			author: issue.user?.login ?? "unknown",
			createdAt: safeIso(issue.created_at),
			url: issue.html_url,
			body: trimBody(issue.body),
		},
	];

	for (const comment of comments) {
		items.push({
			kind: "issue_comment",
			author: comment.user?.login ?? "unknown",
			createdAt: safeIso(comment.created_at),
			url: comment.html_url,
			body: trimBody(comment.body),
		});
	}

	items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	return items;
}

export async function fetchPrThread(client: GitHubClient, owner: string, repo: string, number: number): Promise<ThreadItem[]> {
	const pr = await client.ghJson(["api", `/repos/${owner}/${repo}/pulls/${number}`]);
	const issueComments = await client.fetchAllRestPages(`/repos/${owner}/${repo}/issues/${number}/comments`);
	const reviews = await client.fetchAllRestPages(`/repos/${owner}/${repo}/pulls/${number}/reviews`);
	const reviewComments = await client.fetchAllRestPages(`/repos/${owner}/${repo}/pulls/${number}/comments`);

	const items: ThreadItem[] = [
		{
			kind: "pull_request",
			author: pr.user?.login ?? "unknown",
			createdAt: safeIso(pr.created_at),
			url: pr.html_url,
			body: trimBody(pr.body),
		},
	];

	for (const comment of issueComments) {
		items.push({
			kind: "issue_comment",
			author: comment.user?.login ?? "unknown",
			createdAt: safeIso(comment.created_at),
			url: comment.html_url,
			body: trimBody(comment.body),
		});
	}

	for (const review of reviews) {
		items.push({
			kind: `review_${(review.state ?? "commented").toLowerCase()}`,
			author: review.user?.login ?? "unknown",
			createdAt: safeIso(review.submitted_at ?? review.created_at),
			url: review.html_url,
			body: trimBody(review.body),
		});
	}

	for (const reviewComment of reviewComments) {
		const path = reviewComment.path
			? `\n\n_File: ${reviewComment.path}${typeof reviewComment.line === "number" ? `:${reviewComment.line}` : ""}_`
			: "";
		items.push({
			kind: "review_comment",
			author: reviewComment.user?.login ?? "unknown",
			createdAt: safeIso(reviewComment.created_at),
			url: reviewComment.html_url,
			body: `${trimBody(reviewComment.body)}${path}`.trim(),
		});
	}

	items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	return items;
}

export async function fetchDiscussionThread(
	client: GitHubClient,
	owner: string,
	repo: string,
	number: number,
): Promise<ThreadItem[]> {
	const query = `
query($owner: String!, $repo: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    discussion(number: $number) {
      title
      url
      createdAt
      body
      author { login }
      comments(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          createdAt
          body
          url
          author { login }
          replies(first: 100) {
            nodes {
              createdAt
              body
              url
              author { login }
            }
          }
        }
      }
    }
  }
}
`;

	const items: ThreadItem[] = [];
	let after: string | null = null;
	let seeded = false;

	while (true) {
		const args = [
			"api",
			"graphql",
			"-f",
			`query=${query}`,
			"-F",
			`owner=${owner}`,
			"-F",
			`repo=${repo}`,
			"-F",
			`number=${number}`,
		];
		if (after) args.push("-F", `after=${after}`);

		const payload = await client.ghJson(args);
		const discussion = payload?.data?.repository?.discussion;
		if (!discussion) break;

		if (!seeded) {
			items.push({
				kind: "discussion",
				author: discussion.author?.login ?? "unknown",
				createdAt: safeIso(discussion.createdAt),
				url: discussion.url,
				body: trimBody(discussion.body),
			});
			seeded = true;
		}

		const comments = discussion.comments?.nodes ?? [];
		for (const comment of comments) {
			items.push({
				kind: "discussion_comment",
				author: comment.author?.login ?? "unknown",
				createdAt: safeIso(comment.createdAt),
				url: comment.url,
				body: trimBody(comment.body),
			});

			for (const reply of comment.replies?.nodes ?? []) {
				items.push({
					kind: "discussion_reply",
					author: reply.author?.login ?? "unknown",
					createdAt: safeIso(reply.createdAt),
					url: reply.url,
					body: trimBody(reply.body),
				});
			}
		}

		const pageInfo = discussion.comments?.pageInfo;
		if (!pageInfo?.hasNextPage) break;
		after = pageInfo.endCursor;
	}

	items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	return items;
}

export async function fetchPrChanges(client: GitHubClient, owner: string, repo: string, number: number): Promise<ChangeRef[]> {
	const files = await client.fetchAllRestPages(`/repos/${owner}/${repo}/pulls/${number}/files`);
	let id = 1;

	return files.map((file) => ({
		id: id++,
		filename: String(file.filename ?? "unknown"),
		status: String(file.status ?? "modified"),
		additions: Number(file.additions ?? 0),
		deletions: Number(file.deletions ?? 0),
		changes: Number(file.changes ?? 0),
		patch: typeof file.patch === "string" ? file.patch : undefined,
		blobUrl: typeof file.blob_url === "string" ? file.blob_url : undefined,
		rawUrl: typeof file.raw_url === "string" ? file.raw_url : undefined,
		previousFilename: typeof file.previous_filename === "string" ? file.previous_filename : undefined,
	}));
}

export async function fetchPrCommits(client: GitHubClient, owner: string, repo: string, number: number): Promise<PrCommitRef[]> {
	const commits = await client.fetchAllRestPages(`/repos/${owner}/${repo}/pulls/${number}/commits`);
	return commits.map((commit) => ({
		sha: String(commit.sha ?? ""),
		author: String(commit.author?.login ?? commit.commit?.author?.name ?? "unknown"),
		date: safeIso(commit.commit?.author?.date),
		message: String(commit.commit?.message ?? "").split("\n")[0]?.trim() ?? "",
		url: typeof commit.html_url === "string" ? commit.html_url : undefined,
	}));
}

export async function fetchPrCommitDetail(
	client: GitHubClient,
	owner: string,
	repo: string,
	number: number,
	commitSha: string,
): Promise<PrCommitDetail> {
	const commits = await fetchPrCommits(client, owner, repo, number);
	const match = commits.find((commit) => commit.sha === commitSha || commit.sha.startsWith(commitSha));
	if (!match) {
		throw new Error(`commitSha ${commitSha} not found in PR #${number}`);
	}

	const payload = await client.ghJson(["api", `/repos/${owner}/${repo}/commits/${match.sha}`]);
	const files = Array.isArray(payload?.files) ? payload.files : [];
	return {
		sha: match.sha,
		author: String(payload?.author?.login ?? payload?.commit?.author?.name ?? match.author),
		date: safeIso(payload?.commit?.author?.date ?? match.date),
		message: String(payload?.commit?.message ?? match.message).trim(),
		url: typeof payload?.html_url === "string" ? payload.html_url : match.url,
		changes: files.map((file: any) => ({
			filename: String(file.filename ?? "unknown"),
			status: String(file.status ?? "modified"),
			additions: Number(file.additions ?? 0),
			deletions: Number(file.deletions ?? 0),
			changes: Number(file.changes ?? 0),
			patch: typeof file.patch === "string" ? file.patch : undefined,
		})),
	};
}

export async function fetchPrChecks(client: GitHubClient, owner: string, repo: string, headSha: string): Promise<PrCheckRef[]> {
	const checks = await client.ghJson(["api", `/repos/${owner}/${repo}/commits/${headSha}/check-runs`]);
	const runs = Array.isArray(checks?.check_runs) ? checks.check_runs : [];
	return runs.map((run) => ({
		name: String(run.name ?? "unknown"),
		status: String(run.status ?? "unknown"),
		conclusion: typeof run.conclusion === "string" ? run.conclusion : undefined,
		startedAt: safeIso(run.started_at),
		completedAt: safeIso(run.completed_at),
		url: typeof run.html_url === "string" ? run.html_url : undefined,
	}));
}

export async function fetchReviewComments(client: GitHubClient, owner: string, repo: string, number: number): Promise<ReviewCommentRef[]> {
	const comments = await client.fetchAllRestPages(`/repos/${owner}/${repo}/pulls/${number}/comments`);
	let id = 1;
	return comments.map((comment) => ({
		id: id++,
		author: comment.user?.login ?? "unknown",
		body: trimBody(comment.body),
		createdAt: safeIso(comment.created_at),
		url: typeof comment.html_url === "string" ? comment.html_url : undefined,
		path: typeof comment.path === "string" ? comment.path : undefined,
		line: typeof comment.line === "number" ? comment.line : undefined,
	}));
}

export async function fetchThread(
	client: GitHubClient,
	entity: Entity,
	owner: string,
	repo: string,
	number: number,
): Promise<ThreadItem[]> {
	if (entity === "issue") return fetchIssueThread(client, owner, repo, number);
	if (entity === "pr") return fetchPrThread(client, owner, repo, number);
	return fetchDiscussionThread(client, owner, repo, number);
}
