-- ============================================================
-- Invite codes — only invited users can register
-- ============================================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id          TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  created_by  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- ============================================================
-- Groups
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
  id           TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  created_by   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code  TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text || gen_random_uuid()), 1, 10),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id   TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
