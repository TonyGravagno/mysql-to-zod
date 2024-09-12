import prettier from "prettier";
import "prettier-plugin-sql"; // Ensure the plugin is imported
import SqlPlugin from "prettier-plugin-sql";
import { match } from "ts-pattern";

export type SupportedFormatters = "babel-ts" | "sql";

export const formatByPrettier = async (
	str: string,
	type: SupportedFormatters = "babel-ts",
): Promise<string> =>
	match(type)
		.with("babel-ts", () => {
			return prettier.format(str, {
				parser: "babel-ts",
				// Tabs are used instead of spaces to handle indentation when merging globalSchema
				useTabs: true,
			});
		})
		.with("sql", () => {
			return prettier.format(str, {
				parser: "sql",
				plugins: [SqlPlugin],
				sql: {
					keywordCase: "upper",
				},
			});
		})
		.exhaustive();
