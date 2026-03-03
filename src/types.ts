export type Entity = "issue" | "pr" | "discussion";

export type Action =
	| "format"
	| "list_images"
	| "download_image"
	| "list_changes"
	| "get_change"
	| "list_issues"
	| "list_prs"
	| "pr_overview"
	| "list_pr_commits"
	| "get_pr_commit"
	| "list_review_comments"
	| "list_pr_checks"
	| "list_participants";

export type ThreadItem = {
	kind: string;
	author: string;
	createdAt: string;
	url?: string;
	body: string;
};

export type ImageRef = {
	id: number;
	url: string;
	alt?: string;
};

export type ThreadCacheEntry = {
	items: ThreadItem[];
	cachedAt: number;
};

export type ChangeRef = {
	id: number;
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	changes: number;
	patch?: string;
	blobUrl?: string;
	rawUrl?: string;
	previousFilename?: string;
};

export type RepoCoordinates = {
	owner: string;
	repo: string;
};

export type PrCommitRef = {
	sha: string;
	author: string;
	date: string;
	message: string;
	url?: string;
};

export type PrCommitChange = {
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	changes: number;
	patch?: string;
};

export type PrCheckRef = {
	name: string;
	status: string;
	conclusion?: string;
	startedAt?: string;
	completedAt?: string;
	url?: string;
};

export type PrCommitDetail = {
	sha: string;
	author: string;
	date: string;
	message: string;
	url?: string;
	changes: PrCommitChange[];
};

export type ParticipantRef = {
	login: string;
	roles: Array<"author" | "reviewer" | "commenter">;
	count: number;
};

export type ReviewCommentRef = {
	id: number;
	author: string;
	body: string;
	createdAt: string;
	url?: string;
	path?: string;
	line?: number;
};
