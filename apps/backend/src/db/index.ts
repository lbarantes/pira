/*
* COMANDOS DRIZZLE
* bunx drizzle-kit generate -> Gerar migrations
*
* bunx drizzle-kit migrate -> Executa as migrações pendentes no banco.
*
* bunx drizzle-kit status -> Ver status das migrations
*
* bunx drizzle-kit studio -> banco de dados online
*/

import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema"

export const db = drizzle(Bun.env.DATABASE_URL, { schema });
