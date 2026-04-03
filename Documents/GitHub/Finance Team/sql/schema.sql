-- ============================================================
-- Social Stock Tracker — Database Schema
-- Run once via Neon SQL editor or:
--   psql $POSTGRES_URL_NON_POOLING -f sql/schema.sql
-- ============================================================

-- NextAuth v5 / @auth/pg-adapter required tables
-- IMPORTANT: camelCase columns with double-quotes are mandatory —
-- the adapter generates SQL that references these exact names.

CREATE TABLE IF NOT EXISTS users (
  id              TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  name            TEXT,
  email           TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                   TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "userId"             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL,
  provider             TEXT NOT NULL,
  "providerAccountId"  TEXT NOT NULL,
  refresh_token        TEXT,
  access_token         TEXT,
  expires_at           INTEGER,
  token_type           TEXT,
  scope                TEXT,
  id_token             TEXT,
  session_state        TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id             TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================================
-- Application table
-- tags: stored as JSONB array, e.g. ["AI", "Chips"]
-- Pre-defined tag options (enforced in UI/API, not DB):
--   "Green Energy", "Nuclear", "Chips", "Quantum Computing", "AI"
-- ============================================================

CREATE TABLE IF NOT EXISTS trades (
  id         TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker     TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  price      NUMERIC(12, 4) NOT NULL,
  quantity   NUMERIC(12, 4) NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tags       JSONB NOT NULL DEFAULT '[]',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_trades_user_id   ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_ticker    ON trades(ticker);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_tags      ON trades USING gin(tags);
