import { useEffect, useRef } from "react";
import { json, Form, Link, useActionData, redirect } from "remix";

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

import type { SignupResult } from "~/durable-objects/user.server";

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
    verifyPassword?: string;
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
  let res = await obj.fetch("/signup", request.clone());

  let response = await res.json<SignupResult>();

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

export default function Signup() {
  let { errors } = useActionData<ActionData>() || {};
  let emailInputRef = useRef<HTMLInputElement>(null);
  let passwordInputRef = useRef<HTMLInputElement>(null);
  let verifyPasswordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors?.email) {
      emailInputRef.current?.focus();
      emailInputRef.current?.select();
    } else if (errors?.password) {
      passwordInputRef.current?.focus();
      passwordInputRef.current?.select();
    } else if (errors?.verifyPassword) {
      verifyPasswordInputRef.current?.focus();
      verifyPasswordInputRef.current?.select();
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
            autoComplete="new-password"
          />
          {!!errors?.password && <InputError>{errors.password}</InputError>}
        </Label>

        <Label>
          Verify Password
          <Input
            ref={verifyPasswordInputRef}
            type="password"
            name="verifyPassword"
            autoComplete="new-password"
          />
          {!!errors?.verifyPassword && (
            <InputError>{errors.verifyPassword}</InputError>
          )}
        </Label>

        <CheckboxLabel>
          <Checkbox type="checkbox" name="rememberMe" />
          Remember Me
        </CheckboxLabel>

        <DefaultButton className="block" type="submit" data-testid="signup">
          Signup
        </DefaultButton>
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
