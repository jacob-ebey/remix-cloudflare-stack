import { useEffect, useRef } from "react";
import { json, Form, useActionData, redirect } from "remix";
import { v4 as uuidV4 } from "uuid";

import type { ActionFunction, LoaderFunction } from "~/context.server";

import { verifyLogin } from "~/session.server";

import { DefaultButton } from "~/components/buttons";
import { Input, InputError, Label, Textarea } from "~/components/forms";

export let loader: LoaderFunction = async ({ request, context }) => {
  await verifyLogin(request, context.sessionStorage, {
    failure: "/login",
  });

  return json({});
};

interface ActionData {
  errors?: {
    title?: string;
    body?: string;
  };
}

export let action: ActionFunction = async ({
  request,
  context: {
    env: { USER },
    sessionStorage,
  },
}) => {
  let userId = await verifyLogin(request, sessionStorage, {
    failure: "/login",
  });

  let id = USER.idFromName(userId);
  let obj = USER.get(id);

  let createNoteResponse = await obj.fetch("/notes", {
    method: "post",
    body: request.body,
  });
  let actionData = await createNoteResponse.json<ActionData>();

  if (actionData.errors) {
    return json(actionData);
  }

  return redirect(`/notes`);
};

export default function NewNote() {
  let { errors } = useActionData<ActionData>() || {};
  let titleInputRef = useRef<HTMLInputElement>(null);
  let bodyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (errors?.title) {
      titleInputRef.current?.focus();
    } else if (errors?.body) {
      bodyInputRef.current?.focus();
    }
  }, [errors]);

  return (
    <div className="sm:px-10 p-5">
      <h1 className="mt-6 text-xl">New note</h1>

      <Form method="post">
        <Label>
          Title
          <Input
            ref={titleInputRef}
            type="text"
            name="title"
            autoComplete="off"
          />
          {!!errors?.title && <InputError>{errors.title}</InputError>}
        </Label>

        <Label>
          Body
          <Textarea ref={bodyInputRef} name="body" autoComplete="off" />
          {!!errors?.body && <InputError>{errors.body}</InputError>}
        </Label>

        <DefaultButton className="block" type="submit" data-testid="createNote">
          Create
        </DefaultButton>
      </Form>
    </div>
  );
}
