import { createApi } from "unsplash-js";

const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || "";

export const unsplash = createApi({
  accessKey,
  fetch: globalThis.fetch,
});

