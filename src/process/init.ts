import { A, D, G, O, R, pipe } from "@mobily/ts-belt";
import type { Result } from "@mobily/ts-belt/dist/types/Result";
import type { Command } from "commander";
import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";
import type { DbConnectionOption } from "../options/dbConnection";
import {
	type MysqlToZodOption,
	basicMySQLToZodOption,
} from "../options/options";
export const configLoad = async (
	commandOption: CommandOption,
): Promise<Result<MysqlToZodOption, string>> => {
	const explorer = cosmiconfig("mysqlToZod", {
		searchPlaces: [commandOption.file],
	});
	const cfg = await explorer.search();

	return G.isNotNullable(cfg)
		? R.Ok(cfg.config)
		: R.Error("config file is not Found");
};

/*
  この関数は、configファイルを読み込む
  エラーになるケース
  dbConnectionが存在しない場合
  argv[0]が存在する場合は、argv[0]を優先する
  configを読み込む。
  そのconfigがrightだがdbConnectionがなくて、かつargv[0]がない場合はエラーを出す
  configがleftで、かつargv[0]がない場合はエラーを出す
  configがrightで、argv[0]がないときは、configのdbConnectionを使う
  configがleftで、argv[0]があるときは、argv[0]を使う
*/

type GetDBConnectionProps = {
	dbConnection: O.Option<string>;
	config: R.Result<MysqlToZodOption, string>;
};
const getDBConnection = ({
	dbConnection,
	config,
}: GetDBConnectionProps): Result<string | DbConnectionOption, string> => {
	if (O.isSome(dbConnection)) return R.Ok(dbConnection);
	return pipe(
		config,
		R.toOption,
		O.flatMap((x) => O.getWithDefault(x.dbConnection, O.None)),
		O.toResult("dbConnection is required"),
	);
};

const commandOptionSchema = z.object({
	file: z.string(),
});
type CommandOption = z.infer<typeof commandOptionSchema>;
export const init = async (
	program: Command,
): Promise<Result<MysqlToZodOption, string>> => {
	const commandOption = commandOptionSchema.parse(program.opts());
	const config = await configLoad(commandOption);
	const argsDBConnection = A.get(program.args, 0);
	const dbConnection = getDBConnection({
		dbConnection: argsDBConnection,
		config,
	});

	return R.flatMap(dbConnection, (x) =>
		R.Ok(
			pipe(
				config,
				R.getWithDefault(basicMySQLToZodOption),
				D.set("dbConnection", x),
			),
		),
	);
};
