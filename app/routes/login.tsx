import { useEffect, useRef } from "react";
import { json, Form, Link, useActionData, redirect } from "remix";
import { compare } from "bcryptjs";

import type { ActionFunction, LoaderFunction } from "~/context.server";

import { setLogin, verifyLogin } from "~/session.server";

import { DefaultButton } from "~/components/buttons";
import {
  Checkbox,
  CheckboxLabel,
  Input,
  InputError,
  Label,
} from "~/components/forms";

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
  let rememberMe = formData.get("rememberMe") === "on";

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

  let [userId, storedPassword] = await Promise.all([
    USERS.get(`user:${email}:id`),
    USERS.get(`user:${email}:password`),
  ]);
  if (
    !userId ||
    !storedPassword ||
    !(await compare(password, storedPassword))
  ) {
    actionData.errors = {
      email: "Could not login",
    };
    return json(actionData);
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await setLogin(request, sessionStorage, userId, rememberMe),
    },
  });
};

export default function Login() {
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
      <h1 className="mt-6 text-xl">Login</h1>

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

        <CheckboxLabel>
          <Checkbox type="checkbox" name="rememberMe" />
          Remember Me
        </CheckboxLabel>

        <DefaultButton className="block">Login</DefaultButton>
      </Form>
      <p className="mt-2">
        Don't have an account?{" "}
        <Link to="/signup" className="text-blue-600">
          Signup
        </Link>
      </p>
    </div>
  );
}
