import mysql from "mysql2/promise";
import logger from "./logger.js";

export const conn = await mysql.createConnection({
  user: process.env.BOT_REPLICA_USERNAME,
  password: process.env.BOT_REPLICA_PASSWORD,
  host: process.env.BOT_REPLICA_HOST || "127.0.0.1",
  database: process.env.BOT_REPLICA_DATABASE || "thwiki_p",
  port: Number(process.env.BOT_REPLICA_PORT || 3306),
  waitForConnections: true,
});

export const query = async (sql: string, values: unknown) => {
  try {
    const results = conn.execute(sql, values).catch((err) => {
      logger.error(`Error executing query: ${err}`);
    });
    return results;
  } catch (err) {
    logger.error(`Error executing query: ${err}`);
  }
};

// for template literals
export const replicaQueryLiteral = async (
  sql: string,
  ...values: unknown[]
) => {
  const results = conn.execute(sql, values).catch((err) => {
    logger.error(`Error executing query: ${err}`);
  });
  return results;
};
