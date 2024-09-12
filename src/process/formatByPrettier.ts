import prettier from "prettier";

export const formatByPrettier = async (str: string): Promise<string> =>
	prettier.format(str, {
		parser: "babel-ts",
		// Tabs are used instead of spaces to handle indentation when merging globalSchema
		useTabs: true,
	});
