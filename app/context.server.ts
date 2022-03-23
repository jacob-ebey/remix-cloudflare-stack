import type { SessionStorage } from "remix";
import type { DataFunctionArgs } from "@remix-run/server-runtime";

export interface CloudflareEnvironment {
  SESSION_SECRET: string;
  USERS: KVNamespace;
}

export interface Context {
  env: CloudflareEnvironment;
  sessionStorage: SessionStorage;
}

export type ActionFunction = (
  args: Omit<DataFunctionArgs, "context"> & { context: Context }
) => Response | Promise<Response>;

export type LoaderFunction = (
  args: Omit<DataFunctionArgs, "context"> & { context: Context }
) => Response | Promise<Response>;
