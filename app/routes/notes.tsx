import { json, Form, Link, useFetcher, useLoaderData } from "remix";

import type { ActionFunction, LoaderFunction } from "~/context.server";
import { verifyLogin } from "~/session.server";

import { DefaultButton } from "~/components/buttons";

interface Note {
  id: string;
  title: string;
  body: string;
}

interface LoaderData {
  notes: Note[];
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

  let list = await USERS.list({ prefix: `user:${userId}:note:` });
  let notes = (
    await Promise.all(list.keys.map((key) => USERS.get(key.name)))
  ).reduce<Note[]>((p, c) => {
    if (typeof c === "string") {
      p.push(JSON.parse(c));
    }
    return p;
  }, []);

  return json<LoaderData>({ notes });
};

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
  let toDelete = formData.get("toDelete");

  if (toDelete) {
    await USERS.delete(`user:${userId}:note:${toDelete}`);
  }

  return json({});
};

function NoteItem({ note }: { note: Note }) {
  let fetcher = useFetcher();

  return (
    <li className="mt-4 flex justify-between">
      <div>
        <h2 className="text-lg font-semibold">{note.title}</h2>
        {note.body.split(/\n+/).map((line, i) => (
          <p key={`${i}|${line}`}>{line.trim()}</p>
        ))}
      </div>
      <fetcher.Form method="post" action="/notes">
        <DefaultButton
          type="submit"
          name="toDelete"
          value={note.id}
          disabled={fetcher.state !== "idle"}
        >
          {fetcher.state !== "idle" ? "Deleting..." : "Delete"}
        </DefaultButton>
      </fetcher.Form>
    </li>
  );
}

export default function Notes() {
  let { notes } = useLoaderData<LoaderData>();

  return (
    <div className="sm:px-10 p-5">
      <h1 className="mt-6 text-xl flex items-center justify-between">
        Notes
        <DefaultButton tag={Link} className="whitespace-nowrap" to="/notes/new">
          New note
        </DefaultButton>
      </h1>

      {notes.length === 0 ? (
        <p className="py-2">Get started by creating a new note.</p>
      ) : (
        <ul>
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </ul>
      )}
    </div>
  );
}
