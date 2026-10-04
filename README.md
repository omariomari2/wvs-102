# WVS on Cloudflare

An experimental website scanner with a React chat interface and a Cloudflare Worker backend.
A separate implementation from [WVS-1.01](https://github.com/omariomari2/WVS-1.01).

## Architecture

- TypeScript checks inspect response headers, HTTPS use, and page content.
- Durable Objects hold scan sessions.
- Workers AI supports explanations through the chat interface.

## Develop locally

Install dependencies in the root and frontend directories:

```sh
npm install
npm --prefix frontend install
npm run dev
```

In another terminal, run `npm --prefix frontend run dev`.
Check Worker bindings in `wrangler.toml` and the backend URL in `frontend/src/api.ts` first.
AI calls can require a configured Cloudflare account.

## Limits

Use only sites you own or have permission to assess.
Checks are heuristics. They can produce false positives and do not establish that a site is secure.
This version also tracks generated dependencies and build output; the repository needs cleanup before release.

