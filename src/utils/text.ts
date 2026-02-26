export function mdEscape(s: string): string {
	return s.replace(/\|/g, "\\|").replace(/\r/g, "");
}

export function trimBody(body: string | null | undefined): string {
	return (body ?? "").trim();
}

export function safeIso(iso: string | null | undefined): string {
	if (!iso) return "unknown-time";
	return iso;
}

export function formatSimpleDate(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "unknown-date";
	return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export function formatKindLabel(kind: string): string {
	return kind
		.split("_")
		.map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
		.join(" ");
}
