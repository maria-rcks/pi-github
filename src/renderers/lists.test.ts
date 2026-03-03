import { describe, expect, it } from "bun:test";
import { renderReviewCommentsMarkdown } from "./lists";

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
