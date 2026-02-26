import { extname } from "path";
import type { ImageRef, ThreadItem } from "../types";

export function imageExtFromUrl(url: string): string {
	const clean = url.split("?")[0] ?? url;
	const ext = extname(clean).toLowerCase();
	if (ext && [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"].includes(ext)) return ext;
	return ".img";
}

export function parseImagesFromMarkdown(md: string): Array<{ url: string; alt?: string }> {
	const out: Array<{ url: string; alt?: string }> = [];

	const markdownImage = /!\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)/g;
	for (const match of md.matchAll(markdownImage)) {
		const alt = match[1] ?? "";
		const url = (match[2] ?? "").replace(/[)>]+$/, "").trim();
		if (url) out.push({ url, alt });
	}

	const htmlImage = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
	for (const match of md.matchAll(htmlImage)) {
		const url = (match[1] ?? "").trim();
		if (url) out.push({ url });
	}

	const bareImageUrl = /(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:\?[^\s"')<>]+)?)/gi;
	for (const match of md.matchAll(bareImageUrl)) {
		const url = (match[1] ?? "").trim();
		if (url) out.push({ url });
	}

	return out;
}

export function collectImages(items: ThreadItem[]): ImageRef[] {
	const seen = new Map<string, ImageRef>();
	let id = 1;

	for (const item of items) {
		const images = parseImagesFromMarkdown(item.body);
		for (const image of images) {
			if (!seen.has(image.url)) {
				seen.set(image.url, { id, url: image.url, alt: image.alt });
				id += 1;
			}
		}
	}

	return [...seen.values()].sort((a, b) => a.id - b.id);
}

export function replaceImagesWithTags(md: string, images: ImageRef[]): string {
	if (!md) return md;
	const byUrl = new Map(images.map((image) => [image.url, image.id]));

	let next = md.replace(/!\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)/g, (full, _alt, rawUrl) => {
		const url = String(rawUrl ?? "").replace(/[)>]+$/, "").trim();
		const id = byUrl.get(url);
		return id ? `[image #${id}]` : full;
	});

	next = next.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (full, rawUrl) => {
		const url = String(rawUrl ?? "").trim();
		const id = byUrl.get(url);
		return id ? `[image #${id}]` : full;
	});

	next = next.replace(/(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:\?[^\s"')<>]+)?)/gi, (full, rawUrl) => {
		const url = String(rawUrl ?? "").trim();
		const id = byUrl.get(url);
		return id ? `[image #${id}]` : full;
	});

	return next;
}
