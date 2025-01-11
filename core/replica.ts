import mysql from "mysql2/promise";
import { $ } from "bun"
import { ServiceBase } from '@core/base';
import { config } from '@core/config';

function getReplicaHost(dbname: string, cluster: string = "web") {
  if (!['web', 'analytics'].includes(cluster)) {
    throw new Error('Invalid cluster name')
  }
  const domain = `${cluster}.db.svc.wikimedia.cloud`
  if (dbname.endsWith("_p")) {
    dbname = dbname.slice(0, -2)
  }
  let host = `${dbname}.${domain}`
  if (dbname == "meta") {
    host = `s7.${domain}`
  }
  return host
}


export class Replica extends ServiceBase {
  private _replicaOptions: mysql.PoolOptions = {
    user: this.config.replica.username,
    password: this.config.replica.password,
    port: Number(this.config.replica.port || 3306),
    waitForConnections: true,
  }

  public conn: mysql.Connection | null = null

  public async init() {
    this.log.debug('Initializing replica connection')
    if (!this.isRunOnToolforge()) {
      this.log.warn("Not running on Toolforge, don't forget to set up SSH tunnel using `. replica-tunnel` in separate terminal.")
      const database = this.config.replica.dbname
      this._replicaOptions = {
        ...this._replicaOptions,
        host: '127.0.0.1',
        database,
      }
    } else {
      this._replicaOptions = {
        ...this._replicaOptions,
        host: getReplicaHost(this.config.replica.dbname),
        database: this.config.replica.dbname,
      }
      this.log.debug(`Connecting to ${this._replicaOptions.database} on ${this._replicaOptions.host}`)
    }
    try {
      this.conn = await mysql.createConnection(this._replicaOptions)
    } catch (err) {
      if (err instanceof Error && 'code' in err && err.code === "ECONNREFUSED") {
        this.log.error("Connection refused. Did you forgot to set up the SSH tunnel?")
        process.exit(1)
      }
    }
  }

  public static async createReplicaTunnel(dbname: string, cluster: string = "web", port: number = 3306) {
    if (!config.toolforge.login) {
      throw new Error('Please fill in the Toolforge login in this.config.toml')
    }

    const host = getReplicaHost(dbname, cluster)

    console.log(`Connecting to ${host} on port ${port}...`)
    console.log(`> ssh -N ${config.toolforge.login} -L ${port}:${host}:3306`)
    await $`ssh -N ${config.toolforge.login} -L ${port}:${host}:3306`
  }

  private isRunOnToolforge() {
    return process.env.TOOLFORGE === "true"
  }

  public async query(sql: string, values: any[] = []) {
    if (!this.conn) {
      this.log.debug('Replica connection not initialized, initializing...')
      await this.init()
    }
    return this.conn?.execute(sql, values)
  }

  public end() {
    this.log.debug('Closing replica connection')
    return this.conn?.end()
  }


  set replicaOptions(options: mysql.PoolOptions) {
    this.log.debug('Setting replica options')
    this._replicaOptions = {
      ...this._replicaOptions,
      ...options
    }
    this.init()
  }
}