/** @jsx jsx */
/** @jsxFrag  Fragment */

import { Hono } from "https://deno.land/x/hono@v3.2.1/mod.ts";
import { cors, compress, jsx } from "https://deno.land/x/hono@v3.2.1/middleware.ts";

const app = new Hono();

app.use("*", cors({ origin: "*" }));
app.use("*", compress());

app.get("/hit", (c) => {
  c.status(200);
  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
  return c.body(
    <svg xmlns="http://www.w3.org/2000/svg" height="1" width="100%">
      <line x1="0" y1="0" x2="100%" y2="0" stroke="#888888" stroke-width="1" />
    </svg>
  );
});

app.get("/", (c) => {
  c.status(200);
  return c.json({ hello: "hiiiits" });
});

app.notFound((c) => {
  c.status(404);
  return c.json({ message: "not found" });
});

export default app;
