import { expect, test } from "../setup";
import { signup } from "./utils";

test("can interact with notes", async ({ page, queries }) => {
  const { email } = await signup(page);
  expect(await queries.findByText(email, { exact: false })).toBeTruthy();
  await page.goto("/notes/new");

  let newNoteTitle = "new note title";
  let newNoteBody = "new note body";

  await page.type("input[name=title]", newNoteTitle);
  await page.type("textarea[name=body]", newNoteBody);
  await page.click("button[data-testid=createNote]");
  await page.waitForURL("/notes");
  expect(await queries.findByText(newNoteTitle, { exact: false })).toBeTruthy();
  expect(await queries.findByText(newNoteBody, { exact: false })).toBeTruthy();

  await page.click("button[name=toDelete]");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-testid=noNotes]");
});
