/** @type {import("./src/options/options").MysqlToZodOption} */
const options = {
	output: {
		outDir: "./mysqlToZod",
		fileName: "schema.ts",
	},
	schema: {
		format: "camel",
		prefix: "",
		suffix: "Schema",
		replacements: [],
		nullType: "nullish",
		inline: false,
		zod: {
			implementation: [],
			references: [
				["DATE", "mysqlDate"],
				["TIMESTAMP", "Timestamp"],
			],
		},
	},
	dbConnection: {
		database: "test",
		host: "localhost",
		password: "root",
		port: 3306,
		user: "root",
	},
};
module.exports = options;
