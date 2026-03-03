import { describe, expect, it } from "bun:test";
import { renderPrChecksMarkdown, renderPrCommitMarkdown, renderPrCommitsMarkdown, renderReviewCommentsMarkdown } from "./lists";

describe("renderReviewCommentsMarkdown", () => {
	it("renders compact review comments", () => {
		const text = renderReviewCommentsMarkdown("o", "r", 12, [
			{
				id: 1,
				author: "alice",
				body: "hello\nworld",
				createdAt: "2025-01-01T00:00:00Z",
				path: "src/a.ts",
				line: 10,
				url: "https://example.test",
			},
		]);

		expect(text).toContain("# Review comments for PR o/r#12");
		expect(text).toContain("@alice");
		expect(text).toContain("src/a.ts:10");
	});
});

describe("renderPrCommitsMarkdown", () => {
	it("renders commit lines", () => {
		const text = renderPrCommitsMarkdown("o", "r", 1, [
			{ sha: "abcdef1234", author: "alice", date: "2025-01-01T00:00:00Z", message: "feat: add x", url: "https://x" },
		]);
		expect(text).toContain("# Commits for PR o/r#1");
		expect(text).toContain("abcdef1");
	});
});

describe("renderPrCommitMarkdown", () => {
	it("renders commit diff details", () => {
		const text = renderPrCommitMarkdown("o", "r", 1, {
			sha: "abcdef1234",
			author: "alice",
			date: "2025-01-01T00:00:00Z",
			message: "feat: add x",
			changes: [{ filename: "a.ts", status: "modified", additions: 1, deletions: 0, changes: 1, patch: "+x" }],
		});
		expect(text).toContain("# Commit abcdef1 for PR o/r#1");
		expect(text).toContain("```diff");
	});
});

describe("renderPrChecksMarkdown", () => {
	it("renders check status lines", () => {
		const text = renderPrChecksMarkdown("o", "r", 1, [
			{ name: "ci", status: "completed", conclusion: "success", url: "https://x" },
		]);
		expect(text).toContain("# Checks for PR o/r#1");
		expect(text).toContain("ci: completed/success");
	});
});
