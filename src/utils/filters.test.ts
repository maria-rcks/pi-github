import { describe, expect, it } from "bun:test";
import { applyThreadFilters } from "./filters";
import type { ThreadItem } from "../types";

const items: ThreadItem[] = [
	{ kind: "issue", author: "alice", createdAt: "2025-01-01T00:00:00Z", body: "hello world" },
	{ kind: "review_comment", author: "bob", createdAt: "2025-01-02T00:00:00Z", body: "needs refactor" },
	{ kind: "review_approved", author: "carol", createdAt: "2025-01-03T00:00:00Z", body: "lgtm" },
];

describe("applyThreadFilters", () => {
	it("filters by author", () => {
		const out = applyThreadFilters(items, { author: "bob" });
		expect(out).toHaveLength(1);
		expect(out[0]?.kind).toBe("review_comment");
	});

	it("filters by kind and body contains", () => {
		const out = applyThreadFilters(items, { kind: "review_comment", contains: "refactor" });
		expect(out).toHaveLength(1);
		expect(out[0]?.author).toBe("bob");
	});

	it("filters by date bounds", () => {
		const out = applyThreadFilters(items, { since: "2025-01-02T00:00:00Z", until: "2025-01-03T00:00:00Z" });
		expect(out).toHaveLength(2);
	});
});
