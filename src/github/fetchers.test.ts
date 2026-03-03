import { describe, expect, it } from "bun:test";
import { fetchPrChecks, fetchPrCommitDetail, fetchPrCommits, fetchPrOverview, fetchRepoDirectory, fetchRepoFile, fetchRepoTreeFiles, fetchReviewComments, searchRepoCode } from "./fetchers";

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
		"/repos/o/r/contents/README.md": { encoding: "base64", content: "bGluZTEKbGluZTI=" },
		"/repos/o/r/contents/src": [
			{ name: "utils", type: "dir", path: "src/utils" },
			{ name: "index.ts", type: "file", path: "src/index.ts" },
		],
		"/repos/o/r/git/trees/HEAD?recursive=1": {
			tree: [
				{ path: "src/a.ts", type: "blob" },
				{ path: "src/utils", type: "tree" },
				{ path: "README.md", type: "blob" },
			],
		},
		"/search/code?q=useState%20repo%3Ao%2Fr&page=1&per_page=20": {
			items: [
				{
					path: "src/hooks.ts",
					html_url: "https://github.com/o/r/blob/main/src/hooks.ts",
					text_matches: [{ property: "content", fragment: "function useState()" }],
				},
			],
		},
	};

	return {
		ghJson: async (args: string[]) => {
			const key = [...args].reverse().find((arg) => arg.startsWith("/"));
			return responses[key ?? ""];
		},
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

	it("fetches and decodes repository file", async () => {
		const client = createClient() as any;
		const content = await fetchRepoFile(client, "o", "r", "README.md");
		expect(content).toBe("line1\nline2");
	});

	it("fetches repository directory entries", async () => {
		const client = createClient() as any;
		const entries = await fetchRepoDirectory(client, "o", "r", "src");
		expect(entries).toHaveLength(2);
		expect(entries[0]?.type).toBe("dir");
	});

	it("searches repository code", async () => {
		const client = createClient() as any;
		const results = await searchRepoCode(client, "o", "r", "useState");
		expect(results).toHaveLength(1);
		expect(results[0]?.path).toBe("src/hooks.ts");
	});

	it("fetches repository tree files", async () => {
		const client = createClient() as any;
		const files = await fetchRepoTreeFiles(client, "o", "r");
		expect(files).toEqual(["src/a.ts", "README.md"]);
	});
});
