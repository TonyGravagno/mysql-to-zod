import { type RefinementCtx, z } from "zod";

export const globalSchema = {

	maxLength: (arg: any, limit: number, ctx?: RefinementCtx): boolean => {
		if (arg?.toString()?.length > limit) {
			if (ctx)
				ctx.addIssue({
					code: z.ZodIssueCode.too_big,
					maximum: limit,
					type: typeof arg === "number" ? "number" : "string",
					inclusive: true,
					message: `Too many characters. Maximum ${limit}.`,
				});
			return false;
		}
		return true;
	},
	
};
