import { redirect } from "remix";

import { ActionFunction } from "~/context.server";

export let loader = () => redirect("/");

export let action: ActionFunction = async ({
  request,
  context: { sessionStorage },
}) => {
  let session = await sessionStorage.getSession(request.headers.get("Cookie"));

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
};

export default () => null;
