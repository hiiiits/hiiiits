import { assertEquals } from "https://deno.land/std@0.188.0/testing/asserts.ts";

import app from "./src/app.tsx";

const create = (res: Response, status: number) => {
  assertEquals(res.status, status);

  return {
    headers(name: string, value: string | null) {
      assertEquals(res.headers.get(name), value);
      return this;
    },
    statusText(text: string) {
      assertEquals(res.statusText, text);
      return this;
    },
    redirected() {
      assertEquals(res.redirected, true);
      return this;
    },
    async json(value: unknown) {
      assertEquals(await res.json(), value);
      return this;
    },
  };
};

const isOk = (res: Response) => create(res, 200);
const isNotFound = (res: Response) => create(res, 404);

Deno.test("/", async () => {
  const res = isOk(await app.request("/"));
  await res.json({ hello: "hiiiits" });
});

Deno.test("/hit", async () => {
  const res = isOk(await app.request("/hit"));
  res.headers("Content-Type", "image/svg+xml");
  res.headers("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
});

Deno.test("not found", async () => {
  const assert = async (response: Response) => {
    const res = isNotFound(response);
    await res.json({ message: "not found" });
  };

  await assert(await app.request("/x"));
  await assert(await app.request("/x/y"));
  await assert(await app.request("/x/y/z"));
});
