import { ServiceBase } from "@core/base";
import { config } from "@core/config";
import { $ } from "bun";
import mysql from "mysql2/promise";

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
	private _replicaOptions: mysql.PoolOptions = {
		user: this.config.replica.username,
		password: this.config.replica.password,
		port: Number(this.config.replica.port || 3306),
		waitForConnections: true,
	};

	/**
	 * Represents the MySQL connection instance.
	 * It can be either a `mysql.Connection` object or `null` if the connection is not established.
	 */
	public conn: mysql.Connection | null = null;

	/**
	 * Initializes the replica connection.
	 * If the script is not running on Toolforge, it will log a warning message.
	 */
	public async init() {
		this.log.debug("Initializing replica connection");
		if (!this.isRunOnToolforge()) {
			this.log.warn(
				"Not running on Toolforge, don't forget to set up SSH tunnel using `. replica-tunnel` in separate terminal.",
			);
			const database = this.config.replica.dbname;
			this._replicaOptions = {
				...this._replicaOptions,
				host: "127.0.0.1",
				database,
			};
		} else {
			this._replicaOptions = {
				...this._replicaOptions,
				host: getReplicaHost(this.config.replica.dbname),
				database: this.config.replica.dbname,
			};
			this.log.debug(
				`Connecting to ${this._replicaOptions.database} on ${this._replicaOptions.host}`,
			);
		}
		try {
			this.conn = await mysql.createConnection(this._replicaOptions);
		} catch (err) {
			if (
				err instanceof Error &&
				"code" in err &&
				err.code === "ECONNREFUSED"
			) {
				this.log.error(
					"SSH connection refused. Did you forgot to set up the SSH tunnel?",
				);
				process.exit(1);
			}
		}
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
		if (!config.toolforge.login) {
			throw new Error("Please fill in the Toolforge login in this.config.toml");
		}

		const host = getReplicaHost(dbname, cluster);

		console.log(`Connecting to ${host} on port ${port}...`);
		console.log(`> ssh -N ${config.toolforge.login} -L ${port}:${host}:3306`);
		await $`ssh -N ${{ raw: config.toolforge.login }} -L ${port}:${host}:3306`;
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
	public async query<T extends mysql.QueryResult>(sql: string, values: unknown[] = []) {
		if (!this.conn) {
			await this.init();
		}
		return this.conn!.execute<T>(sql, values);
	}

	public end() {
		this.log.debug("Closing replica connection");
		return this.conn?.end();
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
	set replicaOptions(options: mysql.PoolOptions) {
		this.log.debug("Setting replica options");
		this._replicaOptions = {
			...this._replicaOptions,
			...options,
		};
		this.init();
	}
}
