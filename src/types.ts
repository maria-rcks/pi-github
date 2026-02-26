export type Entity = "issue" | "pr" | "discussion";

export type Action =
	| "format"
	| "list_images"
	| "download_image"
	| "list_changes"
	| "get_change"
	| "list_issues"
	| "list_prs";

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
