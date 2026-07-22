import { Hono } from "hono";
import { verifyAuth } from "@hono/auth-js";

import { unsplash } from "@/lib/unsplash";

const DEFAULT_FETCH_COUNT = 50;
const FEATURED_COLLECTION_IDS = ["317099"];

const app = new Hono().get("/", verifyAuth(), async (c) => {
  const result = await unsplash.photos.getRandom({
    collectionIds: FEATURED_COLLECTION_IDS,
    count: DEFAULT_FETCH_COUNT,
  });

  if (result.errors) {
    return c.json({ error: "Failed to fetch images from Unsplash" }, 400);
  }

  const rawData = result.response;
  const imageList = Array.isArray(rawData) ? rawData : [rawData];

  return c.json({ data: imageList });
});

export default app;

