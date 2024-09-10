import mysql from "mysql2/promise";
import { z } from "zod";
import { outputSqlToFile } from "../../outputToFile";
import { MysqlToZodOption } from "../../../options";

export type RequestForTable = {
	tableName: string,
	option: MysqlToZodOption
}

export const getTableDefinition = async ({ tableName, option }: RequestForTable) => {
	// mysql2@3.11.0\node_modules\mysql2\typings\mysql\lib\Connection.d.ts
	// biome-ignore lint/suspicious/noExplicitAny: Accepts string or ConnectionOptions
	const connection = await mysql.createConnection(option.dbConnection as any);
	const [table] = await connection.query("show create table ??", tableName);
	if (!Array.isArray(table)) return [];
	// biome-ignore lint/suspicious/noExplicitAny: Many possible types for mySQL table
	const result = table.flatMap((x: any) => Object.values(x));
	await connection.destroy();
	const sql = z.string().array().parse(result);
	if (option?.output?.saveSql)
		outputSqlToFile({ sql, output: option.output });
	return sql;
};