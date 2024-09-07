import { mergeGlobalConfig } from "./mergeGlobalConfig";

describe("mergeGlobalConfig", () => {
	it("case1", async () => {
		const old = `import { z } from "zod";
export const globalSchema = {
  mysqlINT: z.number(),
  mysqlVARCHAR: z.string(),
  mysqlTINYINT: z.number(),
  Timestamp: z.date(),
};
`;
		const newFile = `import { z } from "zod";
export const globalSchema = {
  NNN: z.number(),
  mysqlVARCHAR: z.string(),
  mysqlTINYINT: z.number(),
  mysqlTIMESTAMP: z.date(),
};
`;

		const result = `import { z } from "zod";
export const globalSchema = {
  mysqlINT: z.number(),
  mysqlVARCHAR: z.string(),
  mysqlTINYINT: z.number(),
  Timestamp: z.date(),
  NNN: z.number(),
  mysqlTIMESTAMP: z.date(),
};
`;
		expect(
			await mergeGlobalConfig({
				oldGlobalSchema: old,
				newGlobalSchema: newFile,
			}),
		).toBe(result);
	});
});
