import { G } from "@mobily/ts-belt";
import { formatByPrettier } from "../formatByPrettier";
type MergeGlobalConfigProps = {
	oldGlobalSchema: string;
	newGlobalSchema: string;
};
type KV = {
	key: string;
	value: string;
};

const ignoreList = ["import", "export", "};"];

const toKeyValuePair = (schemaText: string) =>
	schemaText
		.split("\n")
		.filter(
			(line) =>
				!ignoreList.some((ignoreWord) => line.includes(ignoreWord)) &&
				line !== "",
		)
		.flatMap((x) => {
			const [key, value] = x.split(":");
			if (!value || !key) return [];

			return {
				key: key.trim(),
				value: value.trim(),
			};
		});

export const mergeGlobalConfig = async ({
	oldGlobalSchema,
	newGlobalSchema: globalSchema,
}: MergeGlobalConfigProps) => {
	const oldAst = toKeyValuePair(oldGlobalSchema);
	const newAst = toKeyValuePair(globalSchema);
	const res = [...oldAst, ...newAst];

	const loop = (rest: KV[], keyList: string[], result: KV[]): KV[] => {
		if (rest.length === 0) return result;
		const [x, ...xs] = rest;
		if (G.isNullable(x)) return result;
		const isExist = keyList.includes(x.key);
		if (isExist) return loop(xs, keyList, result);
		return loop(xs, [...keyList, x.key], [...result, x]);
	};
	const result = loop(res, [], []);
	const importZod = `import { z } from "zod";\n`;
	const exportGlobal = "export const globalSchema = {\n";
	const body = result.map((x) => `  ${x.key}: ${x.value}`).join("\n");
	const end = "};\n";
	const final = await formatByPrettier(
		`${importZod}${exportGlobal}${body}${end}`,
	);
	return final;
};

/* mergeGlobalConfig({
	globalSchemaPath: "./mysqlToZod/globalSchema.ts",
	newGlobalSchema: `import { z } from "zod";
export const globalSchema = {
  NNN: z.number(),
  mysqlVARCHAR: z.string(),
  mysqlTINYINT: z.number(),
  mysqlTIMESTAMP: z.date(),
};\n'
}
`,
});
 */
