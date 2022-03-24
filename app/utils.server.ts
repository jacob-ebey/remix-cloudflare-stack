import { ZodError } from "zod";
import type zod from "zod";

interface ParsedErrors<Schema extends zod.ZodEffects<any>> {
  errors: Record<keyof zod.infer<Schema> & "global", string>;
}

interface ParsedData<Data> {
  data: Data;
}

export type ParsedResult<
  Schema extends zod.ZodEffects<any>,
  Data = zod.infer<Schema>
> = ParsedErrors<Schema> | ParsedData<Data>;

export type Errors<T extends ParsedResult<any, any>> = T extends ParsedResult<
  infer Schema
>
  ? ParsedErrors<Schema>
  : unknown;

export async function tryParseFormData<Schema extends zod.ZodEffects<any>>(
  formData: FormData,
  schema: Schema
): Promise<ParsedResult<Schema>> {
  try {
    let data = await schema.parseAsync(formData);
    return { data };
  } catch (err) {
    let errors: any = {};
    if (err instanceof ZodError) {
      for (let issue of (err as ZodError).issues) {
        errors[issue.path.join(".")] = issue.message;
      }
    } else {
      errors.global =
        (err instanceof Error ? err.message : String(err)) || "unknown error";
    }
    return { errors };
  }
}
