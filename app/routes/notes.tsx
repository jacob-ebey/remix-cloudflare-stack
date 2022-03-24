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
    env: { USER },
    sessionStorage,
  },
}) => {
  let userId = await verifyLogin(request, sessionStorage, {
    failure: "/login",
  });

  let id = USER.idFromName(userId);
  let obj = USER.get(id);
  let notesResponse = await obj.fetch("/notes");
  let notes = await notesResponse.json<Note[]>();
  console.log({ notes });

  return json<LoaderData>({ notes });
};

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

  let formData = new URLSearchParams(await request.text());
  let toDelete = formData.get("toDelete");

  if (toDelete) {
    let id = USER.idFromName(userId);
    let obj = USER.get(id);
    await obj.fetch(`/notes/${toDelete}`, { method: "delete" });
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
        <p className="py-2" data-testid="noNotes">
          Get started by creating a new note.
        </p>
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
