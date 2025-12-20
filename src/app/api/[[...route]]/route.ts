import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { handle } from "hono/vercel";
import {
  sample,
  business,
  ledgerAccounts,
  categories,
  transactions,
  journalEntries,
  reports,
  analytics,
  stripe,
  agent,
  simulator,
  clients,
  invoices,
  collector,
  members,
  profile,
} from "./controllers/(base)";

const app = new Hono().basePath("/api");

app.onError((err, c) => {
  console.log(err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json({ message: "Internal Error" }, 500);
});

const routes = app
  .route("/sample", sample)
  .route("/business", business)
  .route("/ledger-accounts", ledgerAccounts)
  .route("/categories", categories)
  .route("/transactions", transactions)
  .route("/journal-entries", journalEntries)
  .route("/reports", reports)
  .route("/analytics", analytics)
  .route("/stripe", stripe)
  .route("/agent", agent)
  .route("/simulator", simulator)
  .route("/clients", clients)
  .route("/invoices", invoices)
  .route("/collector", collector)
  .route("/members", members)
  .route("/profile", profile);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
