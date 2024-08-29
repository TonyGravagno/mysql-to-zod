# mysql-to-zod

> Convert MySQL schemas into Zod schemas

![default](https://github.com/araera111/mysql-to-zod/assets/63596736/650265b4-414c-49f3-b88c-cf437921960c)

## Project

Ideas, Q&A, and notes about your projects are welcome in [GitHub Discussions](https://github.com/araera111/mysql-to-zod/discussions).

Please submit enhancement requests and bug reports to the [GitHub repo](https://github.com/araera111/mysql-to-zod/issues).

This [online documentation](https://mysql-to-zod.pages.dev/) is included in the project for local browsing and changes.  
Docs include information about dependencies, getting started, detailed configuration options, and tips for using this software effectively.

## Overview

This is how this utility works:

1. Connect to MySQL.
1. Retrieve the CREATE TABLE statement.
1. Parse that text with node-sql-parser.
1. Output a .ts file with Zod schema.

### CLI Example

```bash
npx mysql-to-zod mysql://user:pass@localhost:3306/dbname
```

Now copy your new .ts files into your TypeScript application project.

## Demo

This SQL query was used to generate the MySQL table in the following screenshot.

```sql
CREATE TABLE todo (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

![image](https://github.com/araera111/mysql-to-zod/assets/63596736/c6d4bf03-8109-4ccd-804f-59249a733696)

### Run from CLI or with this project open in your IDE

```bash
npx mysql-to-zod@latest mysql://user@pass:3306/test
```

### Output

```typescript
import { z } from "zod";

export const TodoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
});
export type Todo = z.infer<typeof TodoSchema>;
```

## Config File Options

The file mysqlToZod.config.js plays a significant role in each run.  
With a complete config file, details like the above connection string are not required in the CLI.  
For each project, create and configure a new config file.  
All options are detailed in the [online documentation](https://mysql-to-zod.pages.dev/).

## Config File Examples

![image](https://github.com/araera111/mysql-to-zod/assets/63596736/d3cdc363-1d1f-422f-9ee6-c2ad2c7136d0)

```js:mysqlToZod.config.js
const options = {
  /*
    output
    If you set the following
    The output schemas will be in "./mysqlToZod/schema.ts"
  */
  output: {
    outDir: "./mysqlToZod",
    fileName: "schema.ts",    
  },
  dbConnection: "mysql://root:root@localhost:3306/mydb", //argv0 is priority 1. thisConfig is priority 2.
  tableNames: [], //if empty, all tables.
};
module.exports = options;
```

If dbConnection contains "@" or other special characters, pass it as Config for Knex.

```js:mysqlToZod.config.js
/** @type {import("./src/options/options").MysqlToZodOption} */
const options = {
  /* You can specify the destination directory and file name. */
  output: {
    outDir: "./mysqlToZod",
    fileName: "schema.ts",
  },
  /* 
    You can specify the URL to connect to MySQL(mysql://user:pass@host:port:dbName)
    or
    You can specify the connection information for MySQL.
  */
  dbConnection: {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    database: "test",
  },
  /* if empty, all tables */
  tableNames: [],

  /* Below are the ADVANCED OPTIONS.  A detailed explanation will be written at a later date. */
  comments: {
    table: {
      active: true,
      format: "// [table:!name] : !text",
    },
    column: {
      active: true,
      format: "// !name : !text",
    },
  },
  type: {
    declared: "type",
    format: "pascal",
    prefix: "",
    suffix: "",
    replacements: [],
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
      references: [],
    },
  },
};
module.exports = options;
```

## License

MIT
