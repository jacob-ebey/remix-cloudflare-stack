import { expect, test } from "../setup";
import { signup, login } from "./utils";

test("can signup and login", async ({ page, queries }) => {
  const { email, password } = await signup(page);
  expect(await queries.findByText(email, { exact: false })).toBeTruthy();

  await page.click("button[data-testid=logout]");
  await page.waitForURL("/");

  await login(page, { email, password });
  expect(await queries.findByText(email, { exact: false })).toBeTruthy();
});
