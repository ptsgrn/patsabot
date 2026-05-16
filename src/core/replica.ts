import { ServiceBase } from "@core/base";
import { config } from "@core/config";
import { $ } from "bun";
import mysql, {
  type ExecuteValues,
  type FieldPacket,
  type QueryResult,
  type RowDataPacket,
} from "mysql2/promise";

type DecodeBuffers<T> = T extends Buffer
  ? string
  : T extends Date
    ? T
    : T extends readonly (infer U)[]
      ? DecodeBuffers<U>[]
      : T extends object
        ? { [K in keyof T]: DecodeBuffers<T[K]> }
        : T;

/**
 * Generates the replica host URL for a given database name and cluster.
 *
 * @param dbname - The name of the database. If it ends with "_p", the suffix will be removed.
 * @param cluster - The cluster name, either "web" or "analytics". Defaults to "web".
 * @returns The replica host URL as a string.
 * @throws Will throw an error if the cluster name is not "web" or "analytics".
 */
function getReplicaHost(dbname: string, cluster: string = "web") {
  if (!["web", "analytics"].includes(cluster)) {
    throw new Error("Invalid cluster name");
  }
  const domain = `${cluster}.db.svc.wikimedia.cloud`;
  if (dbname.endsWith("_p")) {
    dbname = dbname.slice(0, -2);
  }
  let host = `${dbname}.${domain}`;
  if (dbname === "meta") {
    host = `s7.${domain}`;
  }
  return host;
}

export class Replica extends ServiceBase {
  private _replicaOptions: mysql.ConnectionOptions = {
    user: this.config.replica.username,
    password: this.config.replica.password,
    port: Number(this.config.replica.port || 3306),
  };

  public conn: mysql.Connection | null = null;
  private tunnelProcess: Bun.Subprocess | null = null;

  public async init() {
    this.log.debug("Initializing replica connection");
    if (!this.isRunOnToolforge()) {
      const replicaHost = getReplicaHost(this.config.replica.dbname);
      const localPort = Number(this.config.replica.port || 3306);
      this._replicaOptions = {
        ...this._replicaOptions,
        host: "127.0.0.1",
        database: this.config.replica.dbname,
      };
      try {
        this.conn = await mysql.createConnection(this._replicaOptions);
      } catch (err) {
        if (this.isConnectionRefused(err)) {
          await this.autoTunnel(replicaHost, localPort);
        } else {
          throw err;
        }
      }
    } else {
      this._replicaOptions = {
        ...this._replicaOptions,
        host: getReplicaHost(this.config.replica.dbname),
        database: this.config.replica.dbname,
      };
      this.log.debug(
        `Connecting to ${this._replicaOptions.database} on ${this._replicaOptions.host}`,
      );
      this.conn = await mysql.createConnection(this._replicaOptions);
    }
  }

  private isConnectionRefused(err: unknown) {
    if (!(err instanceof Error)) {
      return false;
    }
    const code =
      "code" in err ? (err as Error & { code?: unknown }).code : undefined;
    return code === "ECONNREFUSED";
  }

  private isConnectionClosed(err: unknown) {
    if (!(err instanceof Error)) {
      return false;
    }
    const code =
      "code" in err ? (err as Error & { code?: unknown }).code : undefined;
    return (
      code === "PROTOCOL_CONNECTION_LOST" ||
      code === "ECONNRESET" ||
      code === "ECONNREFUSED" ||
      err.message.includes("closed state") ||
      err.message.includes("Connection lost")
    );
  }

  private decodeBuffers<T>(value: T): DecodeBuffers<T> {
    if (Buffer.isBuffer(value)) {
      return value.toString() as DecodeBuffers<T>;
    }

    if (value instanceof Date) {
      return value as DecodeBuffers<T>;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.decodeBuffers(item)) as DecodeBuffers<T>;
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          this.decodeBuffers(item),
        ]),
      ) as DecodeBuffers<T>;
    }

    return value as DecodeBuffers<T>;
  }

  private async resetConnection() {
    const conn = this.conn;
    this.conn = null;
    await conn?.end().catch(() => {});
  }

  private buildSshArgs(replicaHost: string, localPort: number): string[] {
    const { sshUser, sshHost, sshIdentityFile } = this.config.toolforge;
    const args = ["ssh", "-N", "-o", "ExitOnForwardFailure=yes"];
    if (sshIdentityFile) args.push("-i", sshIdentityFile);
    args.push(
      `${sshUser}@${sshHost}`,
      "-L",
      `${localPort}:${replicaHost}:3306`,
    );
    return args;
  }

  private async autoTunnel(replicaHost: string, localPort: number) {
    this.log.info(
      `No tunnel found, starting SSH tunnel to ${replicaHost}:3306 → localhost:${localPort}`,
    );
    this.tunnelProcess = Bun.spawn(this.buildSshArgs(replicaHost, localPort));
    for (let i = 0; i < 20; i++) {
      await Bun.sleep(500);
      try {
        this.conn = await mysql.createConnection(this._replicaOptions);
        this.log.info("SSH tunnel established");
        return;
      } catch {
        // tunnel not ready yet
      }
    }
    this.tunnelProcess.kill();
    this.tunnelProcess = null;
    throw new Error("SSH tunnel did not become ready after 10s");
  }

  /**
   * Creates an SSH tunnel to the replica database via Toolforge.
   * @param dbname Wiki's database name to connect to.
   * @param cluster Database cluster of the wiki database. Defaults to "web".
   * @param port Local port to forward the connection to. Defaults to 3306.
   */
  public static async createReplicaTunnel(
    dbname: string,
    cluster: string = "web",
    port: number = 3306,
  ) {
    if (!config.toolforge.sshUser) {
      throw new Error("toolforge.sshUser not set in config.toml");
    }

    const { sshUser, sshHost, sshIdentityFile } = config.toolforge;
    const host = getReplicaHost(dbname, cluster);
    const target = `${sshUser}@${sshHost}`;
    const identityArgs = sshIdentityFile ? `-i ${sshIdentityFile} ` : "";

    console.log(`Connecting to ${host} on port ${port}...`);
    console.log(`> ssh -N ${identityArgs}${target} -L ${port}:${host}:3306`);
    if (sshIdentityFile) {
      await $`ssh -N -i ${sshIdentityFile} ${target} -L ${port}:${host}:3306`;
    } else {
      await $`ssh -N ${target} -L ${port}:${host}:3306`;
    }
  }

  /**
   * Checks if the script is running on Toolforge.
   * @returns True if the script is running on Toolforge, false otherwise.
   */
  private isRunOnToolforge() {
    return process.env.TOOLFORGE === "true";
  }

  /**
   * Executes a SQL query on the replica database.
   * @param sql SQL query to execute
   * @param values Values to bind to the query
   * @returns The result of the query
   */
  public async query<T = RowDataPacket[]>(
    sql: string,
    values: ExecuteValues = [],
  ): Promise<[DecodeBuffers<T>, FieldPacket[]]> {
    if (!this.conn) {
      await this.init();
    }
    try {
      const [rows, fields] = await this.conn!.execute<QueryResult>(sql, values);
      return [this.decodeBuffers(rows as T), fields];
    } catch (err) {
      if (!this.isConnectionClosed(err)) {
        throw err;
      }

      this.log.warn("Replica connection was closed; reconnecting and retrying");
      await this.resetConnection();
      await this.init();
      const [rows, fields] = await this.conn!.execute<QueryResult>(sql, values);
      return [this.decodeBuffers(rows as T), fields];
    }
  }

  public end() {
    this.log.debug("Closing replica connection");
    this.tunnelProcess?.kill();
    this.tunnelProcess = null;
    return this.resetConnection();
  }

  /**
   * Sets the replica options and reinitializes the connection.
   * @param options The replica options to set
   * @example
   * ```typescript
   * replica.setReplicaOptions({
   *   host: 'enwiki.web.db.svc.wikimedia.cloud',
   * });
   * ```
   */
  set replicaOptions(options: mysql.ConnectionOptions) {
    this.log.debug("Setting replica options");
    this._replicaOptions = {
      ...this._replicaOptions,
      ...options,
    };
    this.init();
  }
}
