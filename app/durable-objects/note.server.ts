import { json } from "remix";
import { v4 as uuidV4 } from "uuid";
import { zfd } from "zod-form-data";

import { CloudflareEnvironment } from "../context.server";
import { tryParseFormData } from "../utils.server";
import type { ParsedResult } from "../utils.server";

export interface Note {
  id: string;
  title: string;
  body: string;
}

let noteSchema = zfd.formData({
  title: zfd.text(),
  body: zfd.text(),
});

export type NoteResult = ParsedResult<typeof noteSchema, Note>;

export class NoteDurableObject {
  constructor(
    private state: DurableObjectState,
    private env: CloudflareEnvironment
  ) {}

  async fetch(request: Request): Promise<Response> {
    let url = new URL(request.url);
    let method = request.method.toLowerCase();

    if (method === "get" && url.pathname === "/") {
      let notes = await this.state.storage.list({ reverse: true });

      return json(Array.from(notes.values()));
    }
    if (method === "delete") {
      let id = url.pathname.slice(1);
      await this.state.storage.delete(id);
      return json({});
    }
    if (method === "post" && url.pathname === "/") {
      let parsed = await tryParseFormData(await request.formData(), noteSchema);

      if ("errors" in parsed) {
        return json(parsed, { status: 400 });
      }
      let id = uuidV4();
      let note = {
        id,
        ...parsed.data,
      };
      await this.state.storage.put(id, note);
      return json<NoteResult>({ data: note });
    }

    return json({ errors: { global: "not found" } }, { status: 404 });
  }
}
