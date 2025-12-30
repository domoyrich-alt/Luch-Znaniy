import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Временно: запуск без БД для тестирования UI
const connectionString = process.env.DATABASE_URL;

let pool: pg.Pool;
let db: ReturnType<typeof drizzle>;

if (connectionString) {
  const shouldUseSsl = /supabase\.com/i.test(connectionString);
  pool = new Pool({
    connectionString,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  });
  db = drizzle(pool, { schema });
  console.log("✅ База данных подключена");
} else {
  console.warn("⚠️ DATABASE_URL не установлен - работа в режиме без БД");
  // Создаем mock pool для предотвращения ошибок
  pool = new Pool();
  db = drizzle(pool, { schema });
}

export { pool, db };
