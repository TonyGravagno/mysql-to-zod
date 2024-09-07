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

const splitWithDelimiter = (str: string, delimiter: string) => {
	const regex = new RegExp(`(?=${delimiter})`);
	return str.split(regex);
};

export const toKeyValuePair = (schemaText: string) => {
	return schemaText
		.replaceAll("\t", "")
		.split("\n\n")
		.filter(
			(line) =>
				!ignoreList.some((ignoreWord) => line.includes(ignoreWord)) &&
				line !== "",
		)
		.flatMap((x) => {
			const [key, ...value] = splitWithDelimiter(x, ":");
			const joinedValue = value.join("").replace(":", ""); // delete first colon.
			if (!joinedValue || !key) return [];
			return {
				key: key.trim(),
				value: joinedValue.trim(),
			};
		});
};

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
	const resultText = `${importZod}${exportGlobal}${body}${end}`;
	const final = await formatByPrettier(resultText);
	return final;
};
