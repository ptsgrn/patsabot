import mysql from 'mysql2/promise';
import { replicaConfig, replicaCredentials } from './config.js';
import logger from './logger.js';

export const conn = await mysql
  .createConnection({
    user: replicaCredentials.username,
    password: replicaCredentials.password,
    host: replicaConfig.dbHost,
    database: replicaConfig.dbName,
    port: replicaConfig.dbPort,
    waitForConnections: true,
  })
  .catch((err) => {
    logger.error(`cannot connect to replica database: ${err.message}`, {
      err,
    });
    return null;
  });
