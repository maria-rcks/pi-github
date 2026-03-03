import { describe, expect, it } from "bun:test";
import { fetchPrChecks, fetchPrCommitDetail, fetchPrCommits, fetchPrOverview, fetchReviewComments } from "./fetchers";

function createClient() {
	const responses: Record<string, unknown> = {
		"/repos/o/r/pulls/1/commits?per_page=100&page=1": [
			{
				sha: "abc123456789",
				author: { login: "alice" },
				html_url: "https://commit",
				commit: { author: { date: "2025-01-01T00:00:00Z", name: "Alice" }, message: "feat: add\n\nbody" },
			},
		],
		"/repos/o/r/commits/abc123456789": {
			author: { login: "alice" },
			html_url: "https://commit",
			commit: { author: { date: "2025-01-01T00:00:00Z" }, message: "feat: add" },
			files: [{ filename: "src/a.ts", status: "modified", additions: 1, deletions: 0, changes: 1, patch: "+x" }],
		},
		"/repos/o/r/commits/abc123456789/check-runs": {
			check_runs: [{ name: "ci", status: "completed", conclusion: "success", html_url: "https://check" }],
		},
		"/repos/o/r/pulls/1": {
			number: 1,
			title: "Add feature",
			state: "open",
			draft: false,
			user: { login: "alice" },
			head: { sha: "abc123456789", ref: "feat" },
			base: { ref: "main" },
			html_url: "https://pr",
		},
		"/repos/o/r/pulls/1/reviews?per_page=100&page=1": [{ state: "APPROVED" }, { state: "COMMENTED" }],
		"/repos/o/r/pulls/1/files?per_page=100&page=1": [{ filename: "src/a.ts", status: "modified", additions: 1, deletions: 0, changes: 1, patch: "+x" }],
		"/repos/o/r/pulls/1/comments?per_page=100&page=1": [{ user: { login: "bob" }, body: "nit", created_at: "2025-01-02T00:00:00Z", path: "src/a.ts", line: 10 }],
	};

	return {
		ghJson: async (args: string[]) => responses[args[1]],
		ghText: async () => "",
		fetchAllRestPages: async (path: string) => {
			const key = `${path}?per_page=100&page=1`;
			return (responses[key] as any[]) ?? [];
		},
		fetchRestPage: async () => [],
	};
}

describe("fetchers", () => {
	it("fetches PR commits", async () => {
		const client = createClient() as any;
		const commits = await fetchPrCommits(client, "o", "r", 1);
		expect(commits).toHaveLength(1);
		expect(commits[0]?.message).toBe("feat: add");
	});

	it("fetches PR commit detail", async () => {
		const client = createClient() as any;
		const detail = await fetchPrCommitDetail(client, "o", "r", 1, "abc1234");
		expect(detail.sha).toBe("abc123456789");
		expect(detail.changes[0]?.filename).toBe("src/a.ts");
	});

	it("fetches PR checks", async () => {
		const client = createClient() as any;
		const checks = await fetchPrChecks(client, "o", "r", "abc123456789");
		expect(checks[0]?.name).toBe("ci");
		expect(checks[0]?.conclusion).toBe("success");
	});

	it("fetches PR overview", async () => {
		const client = createClient() as any;
		const overview = await fetchPrOverview(client, "o", "r", 1, { includeChecks: true, includeFiles: true, includeReviews: true });
		expect(overview.title).toBe("Add feature");
		expect(overview.reviewCounts?.approved).toBe(1);
		expect(overview.checks?.length).toBe(1);
		expect(overview.changes?.length).toBe(1);
	});

	it("fetches review comments", async () => {
		const client = createClient() as any;
		const comments = await fetchReviewComments(client, "o", "r", 1);
		expect(comments[0]?.author).toBe("bob");
		expect(comments[0]?.path).toBe("src/a.ts");
	});
});
