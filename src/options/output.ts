import { z } from "zod";

export const outputSchema = z.object({
	outDir: z.string().optional().default("./mysqlToZod"),
	fileName: z.string().optional().default("schema.ts"),
	globalSchemaFileName: z.string().optional().default("globalSchema.ts"),
	sqlFileName: z.string().optional().default("tables.sql"),
	saveSql: z.boolean().default(false),
	saveAst: z.boolean().default(false),
});

export type OptionOutput = z.infer<typeof outputSchema>;
export const outputDefaults = outputSchema.parse({});
