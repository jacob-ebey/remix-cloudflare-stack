import { json } from "remix";
import { v4 as uuidV4 } from "uuid";

export class UserDurableObject {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    let method = request.method.toLowerCase();
    let url = new URL(request.url);

    if (method === "get" && url.pathname === "/notes") {
      return this.getNotes();
    }
    if (method === "post" && url.pathname === "/notes") {
      return this.createNote(request);
    }
    if (method === "delete" && url.pathname.startsWith("/notes/")) {
      return this.deleteNote(url.pathname.substring("/notes/".length));
    }

    return new Response("unknown");
  }

  private async getNotes(): Promise<Response> {
    let notesList = await this.state.storage.list({
      prefix: "note:",
      reverse: true,
    });
    return json(Array.from(notesList.values()));
  }

  private async createNote(request: Request): Promise<Response> {
    let formData = new URLSearchParams(await request.text());
    let title = formData.get("title")?.trim();
    let body = formData.get("body")?.trim();

    let actionData: any = {};
    if (!title) {
      actionData.errors = {
        title: "Title is required",
      };
    }
    if (!body) {
      actionData.errors = {
        ...actionData.errors,
        body: "Body is required",
      };
    }

    if (actionData.errors) {
      return json(actionData);
    }

    title = title!;
    body = body!;
    let id = uuidV4();

    await this.state.storage.put(`note:${id}`, {
      id,
      title,
      body,
    });

    return json(actionData);
  }

  private async deleteNote(id: string): Promise<Response> {
    await this.state.storage.delete(`note:${id}`);
    return new Response("");
  }
}
