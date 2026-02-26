import { describe, expect, it } from "bun:test";
import { collectImages, parseImagesFromMarkdown, replaceImagesWithTags } from "./images";
import type { ThreadItem } from "../types";

describe("images", () => {
	it("keeps query params for bare URL matches in markdown image syntax", () => {
		const md = "![x](https://host/img.png?raw=1)";
		const parsed = parseImagesFromMarkdown(md).map((image) => image.url);

		expect(parsed.includes("https://host/img.png?raw=1")).toBe(true);
		expect(parsed.includes("https://host/img.png")).toBe(false);
	});

	it("deduplicates identical image URLs that include query params", () => {
		const md = "![x](https://host/img.png?raw=1)";
		const items: ThreadItem[] = [
			{
				id: "1",
				type: "issue",
				author: "alice",
				body: md,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		];

		const images = collectImages(items);
		expect(images).toHaveLength(1);
		expect(images[0]?.url).toBe("https://host/img.png?raw=1");
	});

	it("replaces bare URLs with query params using the matched image ID", () => {
		const md = "https://host/img.png?raw=1";
		const out = replaceImagesWithTags(md, [{ id: 1, url: "https://host/img.png?raw=1" }]);

		expect(out).toBe("[image #1]");
	});
});
