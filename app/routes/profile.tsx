import { useEffect } from "react";
import { LinksFunction, useActionData } from "remix";
import { json, Form, useLoaderData } from "remix";
import { ToastContainer, toast } from "react-toastify";
import reactToastifyStylesUrl from "react-toastify/dist/ReactToastify.css";

import { ActionFunction, LoaderFunction } from "~/context.server";
import { verifyLogin } from "~/session.server";

import type { Profile, ProfileResult } from "~/durable-objects/user.server";

import { DefaultButton } from "~/components/buttons";
import { Input, InputError, Label } from "~/components/forms";

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: reactToastifyStylesUrl }];
};

interface LoaderData {
  displayName: string;
}

export let loader: LoaderFunction = async ({
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
  let profileResponse = await obj.fetch("/profile");
  let profile = await profileResponse.json<Profile>();

  if (!profile) {
    throw new Error("Could not load profile");
  }

  return json<LoaderData>(profile);
};

interface ActionData {
  errors?: {
    displayName?: string;
  };
  success?: true;
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
  let profileResponse = await obj.fetch("/profile", request.clone());
  let responseData = await profileResponse.json<ProfileResult>();

  if ("errors" in responseData) {
    return json(responseData, { status: 400 });
  }

  return json({ success: true });
};

export default function ProfileRoute() {
  let { displayName } = useLoaderData<LoaderData>();
  let actionData = useActionData<ActionData>();
  let { errors } = actionData || {};

  useEffect(() => {
    if (actionData?.success) {
      toast.success("Updated successfully", { autoClose: 1000 });
    }
  }, [actionData]);

  return (
    <>
      <div className="sm:px-10 p-5">
        <h1 className="mt-6 text-xl">Profile</h1>

        <Form method="post">
          <Label>
            Display name
            <Input
              key={displayName}
              name="displayName"
              defaultValue={displayName}
            />
            {!!errors?.displayName && (
              <InputError>{errors.displayName}</InputError>
            )}
          </Label>
          <DefaultButton type="submit" data-testid="updateProfile">
            Update
          </DefaultButton>
        </Form>
      </div>
      <ToastContainer />
    </>
  );
}
