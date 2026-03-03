function escapeRegexChar(char: string): string {
	return /[\\^$+?.()|{}\[\]]/.test(char) ? `\\${char}` : char;
}

export function globToRegex(pattern: string): RegExp {
	const withToken = pattern.replace(/\*\*\//g, "::GLOBSTAR_DIR::");
	let out = "";

	for (let i = 0; i < withToken.length; i += 1) {
		if (withToken.startsWith("::GLOBSTAR_DIR::", i)) {
			out += "(?:.*/)?";
			i += "::GLOBSTAR_DIR::".length - 1;
			continue;
		}

		const ch = withToken[i]!;
		const next = withToken[i + 1];

		if (ch === "*" && next === "*") {
			out += ".*";
			i += 1;
			continue;
		}
		if (ch === "*") {
			out += "[^/]*";
			continue;
		}
		if (ch === "?") {
			out += "[^/]";
			continue;
		}
		if (ch === "{") {
			const end = withToken.indexOf("}", i + 1);
			if (end > i) {
				const inner = withToken.slice(i + 1, end);
				const parts = inner
					.split(",")
					.map((part) => part.trim())
					.filter(Boolean)
					.map((part) => part.split("").map(escapeRegexChar).join(""));
				out += parts.length > 0 ? `(?:${parts.join("|")})` : "";
				i = end;
				continue;
			}
		}

		out += escapeRegexChar(ch);
	}

	return new RegExp(`^${out}$`);
}

export function globMatch(paths: string[], pattern: string): string[] {
	const regex = globToRegex(pattern);
	return paths.filter((path) => regex.test(path));
}
