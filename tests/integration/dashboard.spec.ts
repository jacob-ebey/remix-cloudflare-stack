import { expect, test } from "../setup";
import { signup } from "./utils";

test("can change display name", async ({ page, queries }) => {
  const { email } = await signup(page);
  expect(await queries.findByText(email, { exact: false })).toBeTruthy();
  await page.goto("/profile");

  let newDisplayName = "new display name";

  await page.type("input[name=displayName]", newDisplayName);
  await page.click("button[data-testid=updateProfile]");
  await page.waitForLoadState("networkidle");

  await page.goto("/");
  expect(
    await queries.findByText(newDisplayName, { exact: false })
  ).toBeTruthy();
});
