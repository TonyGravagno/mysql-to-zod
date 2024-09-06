import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { G, O, pipe } from "@mobily/ts-belt";
import { mkdirpSync, writeFileSync } from "fs-extra";
import type { OptionOutput } from "../../options/output";
import { formatByPrettier } from "../formatByPrettier";
import { mergeGlobalConfig } from "./mergeGlobalConfig";

type OutputParams = {
	schemaRawText: string;
	globalSchema: string | undefined;
	output: OptionOutput | undefined;
};

export const outputToFile = async ({
	schemaRawText,
	output,
	globalSchema,
}: OutputParams) => {
	const formatted = await formatByPrettier(schemaRawText);

	const { fileName, outDir } = pipe(
		output,
		O.fromNullable,
		O.getWithDefault({
			fileName: "schema.ts",
			outDir: "./mysqlToZod",
		}),
	);
	mkdirpSync(outDir);
	const savePath = join(process.cwd(), outDir, fileName);
	writeFileSync(savePath, formatted);
	console.info("schema file created!");
	console.info("path: ", savePath);

	/* globalSchema */
	if (G.isNullable(globalSchema)) return;
	const globalSchemaFormatted = await formatByPrettier(globalSchema);
	const globalSchemaSavePath = join(process.cwd(), outDir, "globalSchema.ts");

	const existsGlobalSchema = existsSync(globalSchemaSavePath);
	const oldGlobalSchema = readFileSync(globalSchemaSavePath, "utf-8");

	const outputGlobalSchema = existsGlobalSchema
		? await mergeGlobalConfig({
				oldGlobalSchema,
				newGlobalSchema: globalSchemaFormatted,
			})
		: globalSchemaFormatted;

	writeFileSync(globalSchemaSavePath, outputGlobalSchema);
	console.info("\nglobalSchema file created!");
	console.info("path: ", globalSchemaSavePath);
};
