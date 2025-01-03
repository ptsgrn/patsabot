import mysql from "mysql2/promise";
import { $, type Server } from "bun"

const config = await import('../config.toml')

if (!config.replica) {
  throw new Error("No replica config found.");
}

if (!config.replica.username || !config.replica.password) {
  throw new Error("Please fill in the replica credentials in config.toml");
}

export class Replica {
  private _replicaOptions: mysql.PoolOptions = {
    user: config.replica.username,
    password: config.replica.password,
    port: Number(config.replica.port || 3306),
    waitForConnections: true,
  }

  public conn: mysql.Connection | null = null

  public async init() {
    if (!this.isRunOnToolforge()) {
      console.warn("Not running on Toolforge, don't forget to set up SSH tunnel using `. replica-tunnel` in separate terminal.")
      const database = config.replica.dbname
      this._replicaOptions = {
        ...this._replicaOptions,
        host: '127.0.0.1',
        database,
      }
    } else {
      this._replicaOptions = {
        ...this._replicaOptions,
        host: config.replica.host,
        database: config.replica.dbname,
      }
    }
    this.conn = await mysql.createConnection(this._replicaOptions)
  }

  public static async createReplicaTunnel(dbname: string, cluster: string = "web", port: number = 3306) {
    if (!config.toolforge.login) {
      throw new Error('Please fill in the Toolforge login in config.toml')
    }
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

    console.log(`Connecting to ${host} on port ${port}...`)
    console.log(`> ssh -N ${config.toolforge.login} -L ${port}:${host}:3306`)
    await $`ssh -N ${config.toolforge.login} -L ${port}:${host}:3306`
  }

  private isRunOnToolforge() {
    return process.env.USER == config.toolforge.tooluser
  }

  public async query(sql: string, values: any[] = []) {
    if (!this.conn) {
      await this.init()
    }
    return this.conn?.execute(sql, values)
  }

  public end() {
    return this.conn?.end()
  }


  set replicaOptions(options: mysql.PoolOptions) {
    this._replicaOptions = {
      ...this._replicaOptions,
      ...options
    }
    this.init()
  }
}