import { LinksFunction, useActionData } from "remix";
import { json, Form, useLoaderData, useLocation } from "remix";
import { ToastContainer, toast } from "react-toastify";
import reactToastifyStylesUrl from "react-toastify/dist/ReactToastify.css";

import { ActionFunction, LoaderFunction } from "~/context.server";
import { verifyLogin } from "~/session.server";

import { DefaultButton } from "~/components/buttons";
import { Input, InputError, Label } from "~/components/forms";
import { useEffect } from "react";

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: reactToastifyStylesUrl }];
};

interface LoaderData {
  displayName: string;
}

export let loader: LoaderFunction = async ({
  request,
  context: {
    env: { USERS },
    sessionStorage,
  },
}) => {
  let userId = await verifyLogin(request, sessionStorage, {
    failure: "/login",
  });

  let [displayName] = await Promise.all([
    USERS.get(`user:${userId}:displayName`),
  ]);

  if (typeof displayName !== "string") {
    throw new Error("Could not load displayName");
  }

  return json<LoaderData>({
    displayName,
  });
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
    env: { USERS },
    sessionStorage,
  },
}) => {
  let userId = await verifyLogin(request, sessionStorage, {
    failure: "/login",
  });

  let formData = new URLSearchParams(await request.text());
  let displayName = formData.get("displayName");

  let actionData: ActionData = {};

  if (!displayName) {
    actionData.errors = {
      displayName: "Display name is required",
    };
  }

  if (actionData.errors) {
    return json(actionData);
  }

  displayName = displayName!;

  await Promise.all([USERS.put(`user:${userId}:displayName`, displayName)]);

  return json({ success: true });
};

export default function Profile() {
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
              required
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
