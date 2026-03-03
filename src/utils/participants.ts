import type { ParticipantRef, ThreadItem } from "../types";

type Role = "author" | "reviewer" | "commenter";

function roleFromKind(kind: string): Role {
	if (kind === "issue" || kind === "pull_request" || kind === "discussion") return "author";
	if (kind.startsWith("review_")) return "reviewer";
	return "commenter";
}

export function collectParticipants(items: ThreadItem[]): ParticipantRef[] {
	const byUser = new Map<string, { roles: Set<Role>; count: number }>();

	for (const item of items) {
		const login = item.author?.trim();
		if (!login) continue;
		const row = byUser.get(login) ?? { roles: new Set<Role>(), count: 0 };
		row.roles.add(roleFromKind(item.kind));
		row.count += 1;
		byUser.set(login, row);
	}

	return [...byUser.entries()]
		.map(([login, data]) => ({ login, roles: [...data.roles].sort() as Role[], count: data.count }))
		.sort((a, b) => b.count - a.count || a.login.localeCompare(b.login));
}
