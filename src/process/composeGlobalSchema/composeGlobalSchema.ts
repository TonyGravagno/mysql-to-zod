import { produce } from "immer";
import type { MysqlToZodOption } from "../../options/options";
import { convertToZodType } from "../buildSchemaText/utils/buildSchemaTextUtil";

type ComposeGlobalSchemaRowParams = {
	type: string;
	option: MysqlToZodOption;
};
export const composeGlobalSchemaRow = ({
	type,
	option,
}: ComposeGlobalSchemaRowParams): string => {
	const existReference = option.schema?.zod?.references?.find(
		(x) => x[0] === type,
	);
	return `${
		existReference ? existReference[1] : `mysql${type}`
	}: ${convertToZodType({
		type,
		option: produce(option, (draft) => {
			if (draft.schema) {
				draft.schema.inline = true;
			}
		}),
	})},\n`;
};

type ComposeGlobalSchemaParams = {
	typeList: readonly string[];
	option: MysqlToZodOption;
};

const maxLengthFunction = `
maxLength: (arg: any, limit: number, ctx?: RefinementCtx) : boolean => {
  if (arg?.toString()?.length > limit) {
    if (ctx)
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: limit,
        type: typeof arg === "number" ? "number" : "string",
        inclusive: true,
        message: \`Too many characters. Maximum \${limit}.\`
     });
    return false;
  }
  return true;
},`;


export const composeGlobalSchema = ({
	typeList,
	option,
}: ComposeGlobalSchemaParams): string | undefined => {
	if (option.schema?.inline === true) return undefined;
	const rows = typeList
		.map((type) => composeGlobalSchemaRow({ type, option }))
		.join("");

	const result = [
		'import { z, RefinementCtx } from "zod";',
		"export const globalSchema = {",
		`${rows}`,
		`${maxLengthFunction}`,
		`};`,
	].join("\n");

	return result;
};
