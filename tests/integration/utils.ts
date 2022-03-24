import type { Page } from "@playwright/test";
import { v4 as uuidV4 } from "uuid";

interface SignupResult {
  email: string;
  password: string;
}

export async function signup(page: Page): Promise<SignupResult> {
  let email = uuidV4() + "@test.com";
  let password = uuidV4();

  await page.goto("/signup");
  await page.type("input[name=email]", email);
  await page.type("input[name=password]", password);
  await page.type("input[name=verifyPassword]", password);
  await page.click("button[data-testid=signup]");
  await page.waitForURL("/");

  return { email, password };
}

export async function login(page: Page, { email, password }: SignupResult) {
  await page.goto("/login");
  await page.type("input[name=email]", email);
  await page.type("input[name=password]", password);
  await page.click("button[data-testid=login]");
  await page.waitForURL("/");
}
