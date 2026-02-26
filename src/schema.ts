import { Type } from "@sinclair/typebox";

export const GithubParams = Type.Object({
	action: Type.Optional(
		Type.Union(
			[
				Type.Literal("format"),
				Type.Literal("list_images"),
				Type.Literal("download_image"),
				Type.Literal("list_changes"),
				Type.Literal("get_change"),
				Type.Literal("list_issues"),
				Type.Literal("list_prs"),
			],
			{
				description:
					"Action: format thread markdown; list_issues/list_prs; list_images/download_image; or list_changes/get_change for PR file diffs",
			},
		),
	),
	id: Type.Optional(Type.Integer({ minimum: 1, description: "GitHub thread ID (issue/PR/discussion number)" })),
	entity: Type.Optional(Type.Union([Type.Literal("issue"), Type.Literal("pr"), Type.Literal("discussion")])),
	owner: Type.Optional(Type.String({ description: "GitHub repository owner/org (optional; auto-detected from git origin)" })),
	repo: Type.Optional(Type.String({ description: "GitHub repository name (optional; auto-detected from git origin)" })),
	number: Type.Optional(Type.Integer({ minimum: 1, description: "Deprecated alias for id" })),
	page: Type.Optional(Type.Integer({ minimum: 1, description: "Pagination page (default 1)" })),
	perPage: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, description: "Items per page (default 20)" })),
	imageId: Type.Optional(Type.Integer({ minimum: 1, description: "Image ID (for download_image)" })),
	changeId: Type.Optional(Type.Integer({ minimum: 1, description: "Change ID (for get_change)" })),
	patchId: Type.Optional(Type.Integer({ minimum: 1, description: "Alias for changeId" })),
	codeId: Type.Optional(Type.Integer({ minimum: 1, description: "Alias for changeId" })),
	tmpDir: Type.Optional(Type.String({ description: "Download directory for images (default /tmp)" })),
});
