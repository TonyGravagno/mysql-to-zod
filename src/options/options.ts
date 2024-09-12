import { z } from "zod";
import {
	defaultColumnCommentFormat,
	defaultTableCommentFormat,
	optionCommentsSchema,
} from "./comments";
import { dbConnectionOptionSchema } from "./dbConnection";
import { outputSchema, outputDefaults } from "./output";
import { schemaOptionSchema } from "./schema";
import { separateOptionSchema } from "./separate";
import { syncOptionSchema } from "./sync";
import { typeOptionSchema } from "./type";

export const mysqlToZodOptionSchema = z.object({
	output: outputSchema.optional(),
	dbConnection: dbConnectionOptionSchema.optional(),
	tableNames: z.string().array().optional(),
	comments: optionCommentsSchema.optional(),
	type: typeOptionSchema.optional(),
	schema: schemaOptionSchema.optional(),
	sync: syncOptionSchema.optional(),
	separate: separateOptionSchema.optional(),
});

export type MysqlToZodOption = z.infer<typeof mysqlToZodOptionSchema>;

export const basicMySQLToZodOption: MysqlToZodOption = {
	output: {
		outDir: outputDefaults.outDir,
		fileName: outputDefaults.fileName,
		globalSchemaFileName: outputDefaults.globalSchemaFileName,
		sqlFileName: outputDefaults.sqlFileName,
		saveSql: false,
		saveAst: false,
	},
	tableNames: [],
	comments: {
		table: {
			active: true,
			format: defaultTableCommentFormat,
		},
		column: {
			active: true,
			format: defaultColumnCommentFormat,
		},
	},
	schema: {
		format: "camel",
		prefix: "",
		suffix: "Schema",
		replacements: [],
		nullType: "nullable",
		inline: true,
		zod: { implementation: [] },
	},
	type: {
		declared: "type",
		format: "pascal",
		prefix: "",
		suffix: "",
		replacements: [],
	},
	sync: {
		active: false,
	},
	separate: {
		isSeparate: false,
		insertPrefix: "insert",
		insertSuffix: "",
	},
};
