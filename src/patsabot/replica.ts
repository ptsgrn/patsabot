import mysql from 'mysql2/promise';
import { replicaConfig, replicaCredentials } from './config.js';
import logger from './logger.js';

export const conn = await mysql.createConnection({
  user: replicaCredentials.username,
  password: replicaCredentials.password,
  host: replicaConfig.dbHost,
  database: replicaConfig.dbName,
  port: replicaConfig.dbPort,
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
