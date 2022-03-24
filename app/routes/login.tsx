import { useEffect, useRef } from "react";
import { json, Form, Link, useActionData, redirect } from "remix";

import type { ActionFunction, LoaderFunction } from "~/context.server";
import { setLogin, verifyLogin } from "~/session.server";

import { LoginResult } from "~/durable-objects/user.server";

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
    global?: string;
    email?: string;
    password?: string;
  };
}

export let action: ActionFunction = async ({
  request,
  context: {
    env: { USER },
    sessionStorage,
  },
}) => {
  let id = USER.idFromName("global");
  let obj = USER.get(id);
  let res = await obj.fetch("/login", request.clone());

  let response = await res.json<LoginResult>();

  if ("errors" in response) {
    return json(response);
  }
  let formData = await request.formData();
  let rememberMe = formData.get("rememberMe") === "on";

  return redirect("/", {
    headers: {
      "Set-Cookie": await setLogin(
        request,
        sessionStorage,
        response.data.id,
        rememberMe
      ),
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

        <DefaultButton className="block" type="submit" data-testid="login">
          Login
        </DefaultButton>
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
