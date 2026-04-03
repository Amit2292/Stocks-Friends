// Auth.js v5 App Router catch-all handler.
// IMPORTANT: runtime must be "nodejs" — pg (node-postgres) uses Node.js
// native net/tls modules that are not available in the Edge runtime.

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

export const runtime = "nodejs";
