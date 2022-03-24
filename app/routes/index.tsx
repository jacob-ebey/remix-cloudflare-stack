import { json, Link, Form, useLoaderData } from "remix";

import type { LoaderFunction } from "~/context.server";
import { verifyLogin } from "~/session.server";

import { DefaultButton } from "~/components/buttons";

interface LoaderData {
  displayName: string | null;
}

export let loader: LoaderFunction = async ({
  request,
  context: {
    sessionStorage,
    env: { USERS },
  },
}) => {
  let userId = await verifyLogin(request, sessionStorage);
  let displayName = userId
    ? await USERS.get(`user:${userId}:displayName`)
    : null;

  return json<LoaderData>({
    displayName,
  });
};

export default function Index() {
  let { displayName } = useLoaderData<LoaderData>();

  return (
    <div className="sm:px-10 p-5">
      <h1 className="mt-6 text-xl">
        {displayName ? `Welcome ${displayName}!` : "remix-worker-template"}
      </h1>
      <p className="py-2">
        All-in-one remix starter template for Cloudflare Workers
      </p>

      {displayName ? (
        <>
          <DefaultButton tag={Link} to="/dashboard">
            Dashboard
          </DefaultButton>

          <Form className="inline-block ml-2" action="/logout" method="post">
            <DefaultButton type="submit" data-testid="logout">
              Logout
            </DefaultButton>
          </Form>
        </>
      ) : (
        <>
          <DefaultButton tag={Link} to="/login">
            Login
          </DefaultButton>

          <DefaultButton className="ml-2" tag={Link} to="/signup">
            Signup
          </DefaultButton>
        </>
      )}
    </div>
  );
}
