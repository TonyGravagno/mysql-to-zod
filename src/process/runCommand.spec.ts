import { readFileSync, writeFileSync } from "node:fs";
import { MySqlContainer } from "@testcontainers/mysql";
import { Command } from "commander";
import { createConnection } from "mysql2/promise";
import { runCommand } from "./runCommand";
// use docker. if you don't use docker, this test will fail. skip this test.
describe("runCommand", async () => {
	const container = await new MySqlContainer().start();
	const client = await createConnection({
		host: container.getHost(),
		port: container.getMappedPort(3306),
		user: container.getUsername(),
		password: container.getUserPassword(),
		database: container.getDatabase(),
	});

	it("case1", async () => {
		const options = {
			dbConnection: {
				database: container.getDatabase(),
				host: container.getHost(),
				password: container.getUserPassword(),
				port: container.getMappedPort(3306),
				user: container.getUsername(),
			},
		};
		const todo = `CREATE TABLE todo (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;
		const configJs = `const options = ${JSON.stringify(options, null, 2)};
    module.exports = options;`;
		writeFileSync("test/config/testmainFunctionConfig.js", configJs);
		await client.query(todo);

		const program = new Command();

		const configFilePath = "test/config/testmainFunctionConfig.js";
		expect(await runCommand(program, configFilePath)).toBe(0);

		const result = `import { z } from "zod";
import { globalSchema } from "./globalSchema";
export const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  is_completed: z.number().nullable(),
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
});
export type Todo = z.infer<typeof todoSchema>;
`;
		expect(readFileSync("mysqlToZod/schema.ts", "utf-8")).toBe(result);
	});
});
