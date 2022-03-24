import type { SessionStorage } from "remix";
import { redirect } from "remix";

const USER_ID_KEY = "userId";

export async function setLogin(
  request: Request,
  sessionStorage: SessionStorage,
  userId: string,
  rememberMe: boolean
) {
  let session = await sessionStorage.getSession(request.headers.get("Cookie"));

  session.set(USER_ID_KEY, userId);

  return sessionStorage.commitSession(session, {
    maxAge: rememberMe ? 60 * 60 * 24 * 7 : undefined,
  });
}

export async function verifyLogin(
  request: Request,
  sessionStorage: SessionStorage,
  redirects?: {
    success?: string;
    failure?: string;
  }
) {
  let session = await sessionStorage.getSession(request.headers.get("Cookie"));

  let userId = session.get(USER_ID_KEY);
  if (!userId && redirects?.failure) {
    throw redirect(redirects.failure);
  }
  if (userId && redirects?.success) {
    throw redirect(redirects.success);
  }

  return userId;
}
