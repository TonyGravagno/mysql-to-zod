import prettier from "prettier";

export const formatByPrettier = async (str: string): Promise<string> =>
	prettier.format(str, {
		parser: "babel-ts",
	});
