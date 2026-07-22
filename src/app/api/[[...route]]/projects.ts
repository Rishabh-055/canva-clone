import { z } from "zod";
import { Hono } from "hono";
import { eq, and, desc, asc } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { projects, projectsInsertSchema } from "@/db/schema";

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

const createProjectSchema = projectsInsertSchema.pick({
  name: true,
  json: true,
  width: true,
  height: true,
});

const updateProjectSchema = projectsInsertSchema
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

const app = new Hono()
  .get(
    "/templates",
    verifyAuth(),
    zValidator("query", paginationSchema),
    async (c) => {
      const { page, limit } = c.req.valid("query");

      const data = await db
        .select()
        .from(projects)
        .where(eq(projects.isTemplate, true))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(asc(projects.isPro), desc(projects.updatedAt));

      return c.json({ data });
    }
  )
  .delete(
    "/:id",
    verifyAuth(),
    zValidator("param", idParamSchema),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      const userId = auth.token?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const deletedRows = await db
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning({ id: projects.id });

      if (deletedRows.length === 0) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data: { id: deletedRows[0].id } });
    }
  )
  .post(
    "/:id/duplicate",
    verifyAuth(),
    zValidator("param", idParamSchema),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      const userId = auth.token?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [existingProject] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)));

      if (!existingProject) {
        return c.json({ error: "Not found" }, 404);
      }

      const now = new Date();
      const [duplicatedProject] = await db
        .insert(projects)
        .values({
          name: `Copy of ${existingProject.name}`,
          json: existingProject.json,
          width: existingProject.width,
          height: existingProject.height,
          userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return c.json({ data: duplicatedProject });
    }
  )
  .get(
    "/",
    verifyAuth(),
    zValidator("query", paginationSchema),
    async (c) => {
      const auth = c.get("authUser");
      const { page, limit } = c.req.valid("query");

      const userId = auth.token?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(projects.updatedAt));

      const hasNextPage = data.length === limit;

      return c.json({
        data,
        nextPage: hasNextPage ? page + 1 : null,
      });
    }
  )
  .patch(
    "/:id",
    verifyAuth(),
    zValidator("param", idParamSchema),
    zValidator("json", updateProjectSchema),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");
      const updateValues = c.req.valid("json");

      const userId = auth.token?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [updatedProject] = await db
        .update(projects)
        .set({
          ...updateValues,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();

      if (!updatedProject) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      return c.json({ data: updatedProject });
    }
  )
  .get(
    "/:id",
    verifyAuth(),
    zValidator("param", idParamSchema),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      const userId = auth.token?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)));

      if (!project) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data: project });
    }
  )
  .post(
    "/",
    verifyAuth(),
    zValidator("json", createProjectSchema),
    async (c) => {
      const auth = c.get("authUser");
      const { name, json, height, width } = c.req.valid("json");

      const userId = auth.token?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const now = new Date();
      const [newProject] = await db
        .insert(projects)
        .values({
          name,
          json,
          width,
          height,
          userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!newProject) {
        return c.json({ error: "Something went wrong" }, 400);
      }

      return c.json({ data: newProject });
    }
  );

export default app;

