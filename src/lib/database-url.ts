type DatabaseEnvName =
  | "DB_HOST"
  | "DB_PORT"
  | "DB_USER"
  | "DB_PASSWORD"
  | "DB_NAME"
  | "DB_SCHEMA";

function readRequiredEnv(name: DatabaseEnvName) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to build the database connection URL.`);
  }

  return value;
}

function buildDatabaseUrlFromEnv() {
  const databaseUrl = new URL("postgresql://localhost");
  databaseUrl.hostname = readRequiredEnv("DB_HOST");
  databaseUrl.port = readRequiredEnv("DB_PORT");
  databaseUrl.username = readRequiredEnv("DB_USER");
  databaseUrl.password = readRequiredEnv("DB_PASSWORD");
  databaseUrl.pathname = `/${readRequiredEnv("DB_NAME")}`;
  databaseUrl.searchParams.set("schema", readRequiredEnv("DB_SCHEMA"));

  if (process.env.DB_SSLMODE) {
    databaseUrl.searchParams.set("sslmode", process.env.DB_SSLMODE);
  }

  return databaseUrl;
}

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return buildDatabaseUrlFromEnv().toString();
}

export function getDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL)
    : buildDatabaseUrlFromEnv();
  const schema =
    databaseUrl.searchParams.get("schema") ?? process.env.DB_SCHEMA ?? "public";

  databaseUrl.searchParams.delete("schema");

  return {
    connectionString: databaseUrl.toString(),
    schema,
  };
}
