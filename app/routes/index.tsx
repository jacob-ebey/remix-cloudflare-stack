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
    env: { USER },
  },
}) => {
  let userId = await verifyLogin(request, sessionStorage);

  let profile: any;
  if (userId) {
    let id = USER.idFromName(userId);
    let obj = USER.get(id);
    let profileResponse = await obj.fetch("/profile");
    profile = await profileResponse.json();
  }

  return json<LoaderData>({
    displayName: profile?.displayName,
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
        All-in-one remix starter template for Cloudflare Workers.
      </p>

      <div className="mt-4">
        {displayName ? (
          <>
            <DefaultButton tag={Link} to="/notes">
              Notes
            </DefaultButton>

            <DefaultButton tag={Link} className="ml-2" to="/profile">
              Profile
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
    </div>
  );
}
