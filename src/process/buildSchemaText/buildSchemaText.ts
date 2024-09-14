import { R } from "@mobily/ts-belt";
import { produce } from "immer";
import type { SchemaInformation } from "../../features/sync/types/syncType";
import type { MysqlToZodOption } from "../../options/options";
import type { Column, SchemaResult } from "./types/buildSchemaTextType";
import { strListToStrLf } from "./utils/buildSchemaTextUtil";
import { createSchemaFile } from "./utils/createSchemaFile";
import { getTableDefinition } from "./utils/getTableDefinition";
import { outputDefaults } from "../../options";

type BuildSchemaTextParams = {
	tables: readonly string[];
	option: MysqlToZodOption;
	schemaInformationList: readonly SchemaInformation[];
};

type BuildSchemaTextResult = {
	text: string;
	columns: Column[];
	option: MysqlToZodOption;
};

export const buildSchemaText = async ({
	tables,
	option,
	schemaInformationList,
}: BuildSchemaTextParams): Promise<R.Result<BuildSchemaTextResult, string>> => {
	const importDeclaration = produce(['import { z } from "zod";'], (draft) => {
		if (!option.schema?.inline) {
			// get global schema file name, from config or default, strip trailing file extension (.ts)
			// this implies filename cannot have a period other than the extension delimiter
			const globalSchemaFileName = (option.output?.globalSchemaFileName || outputDefaults.globalSchemaFileName).split('.')[0];
			draft.push(`import { globalSchema } from './${globalSchemaFileName}';`);
		}
	}).join("\n");

	const result: SchemaResult = {
		schema: "",
		columns: [],
	};

	for (const table of tables) {
		const definition = await getTableDefinition({
			tableName: table,
			option,
		});
		const schema = await createSchemaFile(
			definition,
			option,
			schemaInformationList,
		);
		if (R.isOk(schema)) {
			result.schema += R.getExn(schema).schema;
			result.columns.push(...R.getExn(schema).columns);
		}
	}

	return R.flatMap(R.Ok(result), (x) => {
		const text = strListToStrLf([importDeclaration, x.schema]);
		return R.Ok({ text, columns: x.columns, option });
	});
};
