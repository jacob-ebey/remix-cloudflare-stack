/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare-pages/globals" />

declare var process: {
  env: {
    NODE_ENV: "production" | "development";
  };
};
