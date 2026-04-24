import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const database = {
  port: env('DB_PORT'),
  host: env('DB_HOST'),
  user: env('DB_USER'),
  password: env('DB_PASSWORD'),
  name: env('DB_NAME'),
  schema: env('DB_SCHEMA'),
  sslMode: process.env.DB_SSLMODE,
};

const databaseUrl = new URL('postgresql://localhost');
databaseUrl.hostname = database.host;
databaseUrl.port = database.port;
databaseUrl.username = database.user;
databaseUrl.password = database.password;
databaseUrl.pathname = `/${database.name}`;
databaseUrl.searchParams.set('schema', database.schema);

if (database.sslMode) {
  databaseUrl.searchParams.set('sslmode', database.sslMode);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx ./prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl.toString(),
  },
});
