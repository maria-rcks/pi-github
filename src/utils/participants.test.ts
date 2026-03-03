import { describe, expect, it } from "bun:test";
import { collectParticipants } from "./participants";
import type { ThreadItem } from "../types";

describe("collectParticipants", () => {
	it("groups participants with roles and counts", () => {
		const items: ThreadItem[] = [
			{ kind: "pull_request", author: "alice", createdAt: "2025-01-01", body: "" },
			{ kind: "review_approved", author: "bob", createdAt: "2025-01-02", body: "" },
			{ kind: "review_comment", author: "bob", createdAt: "2025-01-03", body: "" },
			{ kind: "issue_comment", author: "carol", createdAt: "2025-01-03", body: "" },
		];

		const out = collectParticipants(items);
		expect(out).toHaveLength(3);
		expect(out[0]).toEqual({ login: "bob", roles: ["reviewer"], count: 2 });
	});
});
