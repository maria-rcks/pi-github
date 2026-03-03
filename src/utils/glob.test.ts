import { describe, expect, it } from "bun:test";
import { globMatch } from "./glob";

describe("globMatch", () => {
	it("matches nested patterns", () => {
		const out = globMatch(["src/a.ts", "src/nested/b.ts", "README.md"], "src/**/*.ts");
		expect(out).toEqual(["src/a.ts", "src/nested/b.ts"]);
	});

	it("supports brace expansion", () => {
		const out = globMatch(["a.ts", "a.js", "a.md"], "a.{ts,js}");
		expect(out).toEqual(["a.ts", "a.js"]);
	});
});
