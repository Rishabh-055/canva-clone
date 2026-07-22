import { z } from "zod";
import { Hono } from "hono";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { replicate } from "@/lib/replicate";

const REMBG_MODEL_VERSION = "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";
const SD3_MODEL_VERSION = "stability-ai/stable-diffusion-3";

const removeBgSchema = z.object({
  image: z.string().min(1, "Image URL or Base64 is required"),
});

const generateImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

const app = new Hono()
  .post(
    "/remove-bg",
    verifyAuth(),
    zValidator("json", removeBgSchema),
    async (c) => {
      const { image } = c.req.valid("json");

      const output = await replicate.run(REMBG_MODEL_VERSION, {
        input: { image },
      });

      return c.json({ data: output as unknown as string });
    }
  )
  .post(
    "/generate-image",
    verifyAuth(),
    zValidator("json", generateImageSchema),
    async (c) => {
      const { prompt } = c.req.valid("json");

      const inputParams = {
        cfg: 3.5,
        steps: 28,
        prompt,
        aspect_ratio: "3:2",
        output_format: "webp",
        output_quality: 90,
        negative_prompt: "",
        prompt_strength: 0.85,
      };

      const output = await replicate.run(SD3_MODEL_VERSION, {
        input: inputParams,
      });

      const imageUrls = output as string[];

      return c.json({ data: imageUrls[0] });
    }
  );

export default app;

