import { A, AR, pipe } from "@mobily/ts-belt";
import type { Command } from "commander";
import { parseZodSchemaFile } from "../features/sync/utils/syncUtil";
import { throwError } from "../throwError";
import { buildSchemaText } from "./buildSchemaText";
import { composeGlobalSchema } from "./composeGlobalSchema";
import { getTables } from "./getTables";
import { init } from "./init";
import { outputToFile } from "./outputToFile";

export const runCommand = (command: Command, configFilePath: string) =>
	pipe(
		command,
		(command) => init(command, configFilePath),
		/* get Tables */
		AR.flatMap((option) => getTables(option)),

		/* fetchSchemaInformationList */
		AR.flatMap(({ option, tableNames }) =>
			parseZodSchemaFile({ option, tableNames }),
		),

		/* buildSchemaText */
		AR.flatMap(({ tableNames, option, schemaInformationList }) =>
			buildSchemaText({
				tables: tableNames,
				option,
				schemaInformationList,
			}),
		),

		/* outputFile */
		AR.match(async ({ columns, option, text }) => {
			const globalSchema = composeGlobalSchema({
				typeList: pipe(
					columns,
					A.map((x) => x.type),
					A.uniq,
				),
				option,
			});
			await outputToFile({
				schemaRawText: text,
				output: option.output,
				globalSchema,
			});
			return 0; // success
		}, throwError),
	);
