import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_R1XqEDctUb4C@ep-misty-shape-am4sdcn4.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

const res = await pool.query(`
  INSERT INTO users (id, name, email)
  VALUES ('dev-user-001', 'Dev User', 'dev@localhost')
  ON CONFLICT (id) DO NOTHING
`);
console.log("Done. Rows inserted:", res.rowCount);
await pool.end();
