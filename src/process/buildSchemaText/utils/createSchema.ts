import { G, pipe } from "@mobily/ts-belt";
import type { SchemaInformation } from "../../../features/sync/types/syncType";
import { schemaInformationToText } from "../../../features/sync/utils/syncUtil";
import { parse } from "../../../features/sync/utils/zodParse";
import type { MysqlToZodOption } from "../../../options/options";
import { schemaOptionSchema } from "../../../options/schema";
import { separateOptionSchema } from "../../../options/separate";
import { typeOptionSchema } from "../../../options/type";
import { formatByPrettier } from "../../formatByPrettier";
import type { Column, SchemaResult } from "../types/buildSchemaTextType";
import {
	type CreateSchemaModeUnion,
	combineSchemaNameAndSchemaString,
	composeColumnStringList,
	composeSchemaName,
	composeTableSchemaTextList,
	composeTypeString,
} from "./buildSchemaTextUtil";
type UpdateSchemaTextProps = {
	schemaName: string;
	schemaText: string;
	schemaInformation: SchemaInformation;
};

export const mergeSchemaTextWithOldInformation = async ({
	schemaName,
	schemaInformation,
	schemaText,
}: UpdateSchemaTextProps) => {
	/* 完成したテキストからschemaInformationをつくる */
	const formatted = await formatByPrettier(schemaText);
	const nextSchemaInformation = pipe(
		formatted,
		parse,
		(x) => x[0] as SchemaInformation,
		(x) => {
			return {
				tableName: x.tableName,
				properties: x.properties.flatMap((x) =>
					G.isNotNullable(x) ? [x] : [],
				),
			};
		},
	);

	/*
    完成したテキストとnameが一致していないときは、そのまま返す
    この前ですでにfindを使って取得しているはずだが、一応。
  */
	if (nextSchemaInformation.tableName !== schemaName) return schemaText;

	/* 一致しているときは、propertiesからfindして、あったら入れ替える */
	const nextProperties = nextSchemaInformation.properties.map((property) => {
		const replaceElement = schemaInformation.properties.find(
			(y) => y.name === property.name,
		);
		if (G.isNullable(replaceElement)) return property;
		return replaceElement;
	});

	const replacedSchemaInformation = {
		...nextSchemaInformation,
		properties: nextProperties,
	};
	const rawNextSchemaText = schemaInformationToText(
		replacedSchemaInformation,
	).join("");
	const formattedSchemaText = await formatByPrettier(rawNextSchemaText);
	return formattedSchemaText.trim();
};

type CreateSchemaProps = {
	tableName: string;
	columns: Column[];
	options: MysqlToZodOption;
	tableComment: string | undefined;
	schemaInformationList: readonly SchemaInformation[];
	mode: CreateSchemaModeUnion;
};
export const createSchema = async ({
	tableName,
	columns,
	options,
	tableComment,
	schemaInformationList,
	mode,
}: CreateSchemaProps): Promise<SchemaResult> => {
	const schemaString = columns
		.map((x) =>
			composeColumnStringList({ column: x, option: options, mode }).join("\n"),
		)
		.join("");

	const schemaOption = schemaOptionSchema.parse(options.schema);
	const separateOption = separateOptionSchema.parse(options.separate);

	const schemaName = composeSchemaName({
		schemaOption,
		tableName,
		mode,
		separateOption,
	});

	const schemaText = combineSchemaNameAndSchemaString({
		schemaName,
		schemaString,
	});

	/* schemaTextを古いschemaInformationとmergeする */
	const thisSchemaInformation = schemaInformationList.find(
		(x) => x.tableName === schemaName,
	);

	const merged = G.isNullable(thisSchemaInformation)
		? schemaText
		: await mergeSchemaTextWithOldInformation({
				schemaName,
				schemaText,
				schemaInformation: {
					tableName: thisSchemaInformation.tableName,
					properties: thisSchemaInformation.properties.flatMap((x) =>
						G.isNotNullable(x) ? [x] : [],
					),
				},
			});

	const typeOption = typeOptionSchema.parse(options.type);

	const typeString = composeTypeString({
		typeOption,
		tableName,
		schemaName,
		mode,
		separateOption,
	});

	const schema = composeTableSchemaTextList({
		schemaText: merged,
		typeString,
		tableComment,
	});

	const separateSchema = separateOptionSchema.parse(options.separate);

	/* isSeparateのとき、関数をinsert modeで再実行する */
	const separeteInsertSchema =
		separateSchema.isSeparate && mode === "select"
			? `\n${await createSchema({
					tableName,
					columns,
					options,
					tableComment,
					schemaInformationList,
					mode: "insert",
				}).then((x) => x.schema)}`
			: "";

	return {
		schema: schema.join("\n") + separeteInsertSchema,
		columns,
	};
};
