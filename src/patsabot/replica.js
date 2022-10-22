import mysql from 'mysql2/promise';
import { replicaConfig, replicaCredentials } from './config.js';
export const conn = mysql.createConnection({
    user: replicaCredentials.username,
    password: replicaCredentials.password,
    host: replicaConfig.dbHost,
    database: replicaConfig.dbName,
    port: replicaConfig.dbPort,
});
