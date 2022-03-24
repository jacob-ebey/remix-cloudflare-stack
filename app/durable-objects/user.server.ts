import { json } from "remix";
import { compare, hash } from "bcryptjs";
import { v4 as uuidV4 } from "uuid";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { CloudflareEnvironment } from "../context.server";
import { tryParseFormData } from "../utils.server";
import type { ParsedResult } from "../utils.server";

export interface User {
  id: string;
  email: string;
}

interface UserWithPassword extends User {
  passwordHash: string;
}

export interface Profile {
  displayName: string;
}

let signupSchema = zfd
  .formData({
    email: zfd.text(z.string().email()),
    password: zfd.text(z.string().min(8)),
    verifyPassword: zfd.text(),
  })
  .refine((data) => data.password === data.verifyPassword, {
    message: "Passwords do not match",
    path: ["verifyPassword"],
  })
  .transform(async (data) => {
    return {
      email: data.email,
      passwordHash: await hash(data.password, 10),
    };
  });

export type SignupResult = ParsedResult<typeof signupSchema, User>;

let loginSchema = zfd.formData({
  email: zfd.text(z.string().email()),
  password: zfd.text(z.string().min(8)),
});

export type LoginResult = ParsedResult<typeof signupSchema, User>;

let profileSchema = zfd.formData({
  displayName: zfd.text(),
});

export type ProfileResult = ParsedResult<typeof signupSchema, Profile>;

export class UserDurableObject {
  constructor(
    private state: DurableObjectState,
    private env: CloudflareEnvironment
  ) {}

  async fetch(request: Request): Promise<Response> {
    let url = new URL(request.url);
    let method = request.method.toLowerCase();

    if (url.pathname === "/login" && method === "post") {
      let parsed = await tryParseFormData(
        await request.formData(),
        loginSchema
      );

      if ("errors" in parsed) {
        return json(parsed, { status: 400 });
      }

      let userId = await this.state.storage.get<string>(parsed.data.email);
      if (!userId) {
        return json(
          {
            errors: {
              email: "Could not login",
            },
          },
          { status: 400 }
        );
      }

      let user = await this.state.storage.get<UserWithPassword>(userId);
      if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
        return json<LoginResult>(
          {
            errors: {
              email: "Could not login",
            },
          },
          { status: 400 }
        );
      }
      user.id = userId;

      return json<LoginResult>({
        data: {
          id: userId,
          email: user.email,
        },
      });
    }

    if (url.pathname === "/signup" && method === "post") {
      let parsed = await tryParseFormData(
        await request.formData(),
        signupSchema
      );
      if ("errors" in parsed) {
        return json(parsed, { status: 400 });
      }

      if (await this.state.storage.get(parsed.data.email)) {
        return json(
          {
            errors: {
              email: "Could not signup",
            },
          },
          { status: 400 }
        );
      }

      let userId = uuidV4();
      await Promise.all([
        this.state.storage.put(userId, parsed.data),
        this.state.storage.put(parsed.data.email, userId),
      ]);

      let id = this.env.USER.idFromName(userId);
      let obj = this.env.USER.get(id);
      let formData = new FormData();
      formData.set("displayName", parsed.data.email);
      await obj.fetch("/profile", { method: "post", body: formData });

      return json<SignupResult>({
        data: {
          id: userId,
          email: parsed.data.email,
        },
      });
    }

    if (url.pathname === "/profile" && method === "get") {
      return json(await this.state.storage.get("profile"));
    }

    if (url.pathname === "/profile" && method === "post") {
      let parsed = await tryParseFormData(
        await request.formData(),
        profileSchema
      );
      if ("errors" in parsed) {
        return json(parsed, { status: 400 });
      }

      await this.state.storage.put("profile", parsed.data);

      return json({
        data: parsed.data,
      });
    }

    return json({ errors: { global: "not found" } }, { status: 404 });
  }
}
