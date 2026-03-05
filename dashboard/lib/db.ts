import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export function buildWhereClause(filters: Record<string, string | null>): {
  clause: string;
  params: unknown[];
} {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.titles) {
    const titles = filters.titles.split(",");
    conditions.push(
      `t.normalized_title IN (${titles.map(() => `$${idx++}`).join(",")})`
    );
    params.push(...titles);
  }
  if (filters.regions) {
    const regions = filters.regions.split(",");
    conditions.push(
      `f.location_region IN (${regions.map(() => `$${idx++}`).join(",")})`
    );
    params.push(...regions);
  }
  if (filters.contract_type) {
    const types = filters.contract_type.split(",");
    conditions.push(
      `f.contract_type IN (${types.map(() => `$${idx++}`).join(",")})`
    );
    params.push(...types);
  }
  if (filters.remote_policy) {
    const policies = filters.remote_policy.split(",");
    conditions.push(
      `f.remote_policy IN (${policies.map(() => `$${idx++}`).join(",")})`
    );
    params.push(...policies);
  }
  if (filters.experience_level) {
    const levels = filters.experience_level.split(",");
    conditions.push(
      `f.experience_level IN (${levels.map(() => `$${idx++}`).join(",")})`
    );
    params.push(...levels);
  }
  if (filters.source) {
    conditions.push(`f.source = $${idx++}`);
    params.push(filters.source);
  }

  return {
    clause: conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "",
    params,
  };
}
