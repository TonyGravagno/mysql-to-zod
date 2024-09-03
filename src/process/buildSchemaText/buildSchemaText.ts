import { R } from "@mobily/ts-belt";
import { produce } from "immer";
import type { SchemaInformation } from "../../features/sync/types/syncType";
import type { MysqlToZodOption } from "../../options/options";
import type { Column, SchemaResult } from "./types/buildSchemaTextType";
import { strListToStrLf } from "./utils/buildSchemaTextUtil";
import { createSchemaFile } from "./utils/createSchemaFile";
import { getTableDefinition } from "./utils/getTableDefinition";

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
		if (!option.schema?.inline)
			draft.push("import { globalSchema } from './globalSchema';");
	}).join("\n");

	const result: SchemaResult = {
		schema: "",
		columns: [],
	};

	for (const table of tables) {
		const definition = await getTableDefinition(
			table,
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			option.dbConnection as any,
		);
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
