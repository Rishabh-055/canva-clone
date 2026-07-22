import { Context, Hono } from "hono";
import { handle } from "hono/vercel";
import { AuthConfig, initAuthConfig } from "@hono/auth-js";

import aiRouter from "./ai";
import usersRouter from "./users";
import imagesRouter from "./images";
import projectsRouter from "./projects";
import subscriptionsRouter from "./subscriptions";

import authConfig from "@/auth.config";

export const runtime = "nodejs";

const createAuthConfig = (c: Context): AuthConfig => ({
  secret: c.env.AUTH_SECRET,
  ...authConfig,
});

const app = new Hono().basePath("/api");

app.use("*", initAuthConfig(createAuthConfig));

const routes = app
  .route("/ai", aiRouter)
  .route("/users", usersRouter)
  .route("/images", imagesRouter)
  .route("/projects", projectsRouter)
  .route("/subscriptions", subscriptionsRouter);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;

