// @vercel/postgres auto-reads POSTGRES_URL from environment.
// Uses @neondatabase/serverless under the hood (Edge + Node compatible).
// Always use the sql tagged template — it auto-parameterizes expressions.
//
// Usage:
//   import { sql } from "@/lib/db";
//   const { rows } = await sql`SELECT * FROM trades WHERE user_id = ${userId}`;

export { sql } from "@vercel/postgres";
