import { useEffect, useRef } from "react";
import { json, Form, Link, useActionData, redirect } from "remix";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

import type { ActionFunction, LoaderFunction } from "~/context.server";

import { setLogin, verifyLogin } from "~/session.server";

import { DefaultButton } from "~/components/buttons";
import { Input, InputError, Label } from "~/components/forms";

export let loader: LoaderFunction = async ({ request, context }) => {
  await verifyLogin(request, context.sessionStorage, {
    success: "/",
  });

  return json({});
};

interface ActionData {
  errors?: {
    email?: string;
    password?: string;
  };
}

export let action: ActionFunction = async ({
  request,
  context: {
    env: { USERS },
    sessionStorage,
  },
}) => {
  let formData = new URLSearchParams(await request.text());
  let email = formData.get("email");
  let password = formData.get("password");

  let actionData: ActionData = {};
  if (!email || !email.includes("@") || email.length < 5) {
    actionData.errors = {
      email: "Invalid email",
    };
  }
  if (!password || password.length < 8) {
    actionData.errors = {
      ...actionData.errors,
      password: "Password must be at least 8 characters",
    };
  }

  if (actionData.errors) {
    return json(actionData);
  }

  email = email!;
  password = password!;

  let existingUserId = await USERS.get(`user:${email}:id`);
  if (existingUserId) {
    actionData.errors = {
      email: "Could not signup",
    };
    return json(actionData);
  }

  let userId = uuidv4();
  let hashedPassword = await hash(password, 10);
  try {
    await Promise.all([
      USERS.put(`user:${email}:id`, userId),
      USERS.put(`user:${email}:password`, hashedPassword),
      USERS.put(`user:${userId}:displayName`, email),
    ]);
  } catch (err) {
    try {
      await Promise.all([
        USERS.delete(`user:${email}:id`),
        USERS.delete(`user:${email}:password`),
      ]);
    } finally {
      throw err;
    }
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await setLogin(request, sessionStorage, userId),
    },
  });
};

export default function Signup() {
  let { errors } = useActionData<ActionData>() || {};
  let emailInputRef = useRef<HTMLInputElement>(null);
  let passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors?.email) {
      emailInputRef.current?.focus();
    } else if (errors?.password) {
      passwordInputRef.current?.focus();
    }
  }, [errors]);

  return (
    <div className="sm:px-10 p-5">
      <h1 className="mt-6 text-xl">Signup</h1>

      <Form method="post">
        <Label>
          Email
          <Input
            ref={emailInputRef}
            type="email"
            name="email"
            autoComplete="current-email"
          />
          {!!errors?.email && <InputError>{errors.email}</InputError>}
        </Label>
        <Label>
          Password
          <Input
            ref={passwordInputRef}
            type="password"
            name="password"
            autoComplete="current-password"
          />
          {!!errors?.password && <InputError>{errors.password}</InputError>}
        </Label>

        <DefaultButton className="block">Signup</DefaultButton>
      </Form>
      <p className="mt-2">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600">
          Login
        </Link>
      </p>
    </div>
  );
}
