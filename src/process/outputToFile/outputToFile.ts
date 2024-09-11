import { join } from "node:path";
import { G } from "@mobily/ts-belt";
import { mkdirpSync, readFileSync, writeFileSync } from "fs-extra";
import { type OptionOutput, outputDefaults } from "../../options";
import {
	type SupportedFormatters,
	formatByPrettier,
} from "../formatByPrettier";

export type SchemaOutputParams = {
	schemaRawText: string;
	globalSchema?: string;
	output?: OptionOutput;
};

export type SqlOutputParams = {
	sql: string[];
	output?: OptionOutput;
};

/**
 * General purpose output: Creates a folder if not exists, writes content to a file, and logs the result.
 * @param {string} outDir - Directory to save the file.
 * @param {string} fileName - File name for the output file.
 * @param {string} content - Content (usually formatted code) to be written to the file.
 * @param {string} fileType - Type of the file being written (for logging purposes).
 */
export const writeLocalFile = (
	outDir: string,
	fileName: string,
	content: string,
	formatType?: SupportedFormatters,
) => {
	mkdirpSync(outDir);
	const savePath = join(process.cwd(), outDir, fileName);
	writeFileSync(savePath, content);

	let fileType = "";
	switch (formatType) {
		case "babel-ts":
			fileType = "TS code file";
			break;
		case "sql":
			fileType = "SQL file";
			break;
		default:
			fileType = "File";
			break;
	}

	console.info(`${fileType} created!`);
	console.info("path: ", savePath);
};

/**
 * Formats content (TS or SQL) and calls writeLocalFile to save the file.
 * @param {string} rawText - The raw text content to be formatted.
 * @param {string} formatType - Format type for prettier (e.g., "babel-ts", "sql").
 * @param {OptionOutput} output - Output options containing directory and file name.
 * @param {string} fileNameOverride - If present, use this file name rather than options value or default.
 */
export const writeFormattedFile = async (
	rawText: string,
	formatType: SupportedFormatters,
	fileName: string,
	output?: OptionOutput,
) => {
	let formatted = await formatByPrettier(rawText, formatType);
	const outDir = output?.outDir || outputDefaults.outDir;

	// Temporary
	if (
		formatType === "sql" &&
		output?.saveSql &&
		output?.sqlFileName !== "tablename"
	) {
		// append, don't replace
		const savePath = join(process.cwd(), outDir, fileName);
		try {
			const existing = readFileSync(savePath, "utf-8");
			formatted = `${existing}\n${formatted}`;
		} catch (_ignoreFileDoesntExistError) {}
	}

	writeLocalFile(outDir, fileName, formatted, formatType);
};

/**
 * Handles the SQL output to a file.
 * @param {SqlOutputParams} params - SQL text and output specs
 */
export const outputSqlToFile = async ({ sql, output }: SqlOutputParams) => {
	// first line is the table name
	const tableName = sql.slice(0, 1);
	const sqlQuery = sql.slice(1).join("\n"); // remove first line = tablename

	// if "tablename" is hardcoded in config file, use current table, otherwise use filename from config, or default
	const fileName =
		output?.sqlFileName === "tablename"
			? `${tableName}.sql`
			: output?.sqlFileName || outputDefaults.sqlFileName;

	await writeFormattedFile(sqlQuery, "sql", fileName, output);
};

/**
 * Handles the schema output, including the global schema if provided.
 * @param {SchemaOutputParams} params - TS/Zod code, output specs, maybe globalSchema
 */
export const outputSchemaToFile = async ({
	schemaRawText,
	globalSchema,
	output,
}: SchemaOutputParams) => {
	// if "tablename" is hardcoded in config file, use current table, otherwise use filename from config, or default
	const fileName =
		output?.fileName === "tablename"
			? "tablename.ts"
			: output?.fileName || outputDefaults.fileName;
	// TODO: Not fully implemented yet - we don't have the table name here.

	await writeFormattedFile(schemaRawText, "babel-ts", fileName, output);

	/* Handle global schema if provided */
	if (!G.isNullable(globalSchema)) {
		await writeFormattedFile(
			globalSchema,
			"babel-ts",
			"globalSchema.ts",
			output,
		);
	}
};
