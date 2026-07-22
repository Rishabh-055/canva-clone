import { z } from "zod";
import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(3, "Password must be at least 3 characters").max(20),
});

const app = new Hono().post(
  "/",
  zValidator("json", registrationSchema),
  async (c) => {
    const { name, email, password } = c.req.valid("json");

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return c.json({ error: "Email already in use" }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
    });

    return c.json(null, 200);
  }
);

export default app;

