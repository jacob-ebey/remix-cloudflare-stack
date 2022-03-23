import { json, Form, useLoaderData } from "remix";

import { ActionFunction, LoaderFunction } from "~/context.server";
import { verifyLogin } from "~/session.server";

import { DefaultButton } from "~/components/buttons";
import { Input, Label } from "~/components/forms";

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

  return json({});
};

export default function Dashboard() {
  let { displayName } = useLoaderData<LoaderData>();

  return (
    <div className="sm:px-10 p-5">
      <h1 className="mt-6 text-xl">Dashboard</h1>

      <Form method="post">
        <Label>
          Display name
          <Input
            required
            key={displayName}
            name="displayName"
            defaultValue={displayName}
          />
        </Label>
        <DefaultButton>Update</DefaultButton>
      </Form>
    </div>
  );
}
