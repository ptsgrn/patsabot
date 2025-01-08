import { Bot } from '@core/bot'
import { Replica } from '@core/replica'
import { createId } from '@paralleldrive/cuid2'
import { Command, InvalidArgumentError, Option } from '@commander-js/extra-typings'
import { version } from "../package.json"
import { ServiceBase } from './base'

class ScriptRunner extends ServiceBase {
  private cli = new Command()
  private config = {
    logLevel: "info",
    configFile: "config.toml"
  }

  async scriptModule(scriptName: string) {
    if (!scriptName) {
      throw new Error('No script name provided')
    }
    if (!scriptName.match(/^[a-z0-9-\/\.]+$/)) {
      throw new Error('Invalid script name')
    }
    if (!Bun.file(`@scripts/${scriptName}.ts`).exists()) {
      throw new Error('Script not found')
    }

    const scriptModule = await import(`@scripts/${scriptName}.ts`)

    if (!scriptModule.default) {
      throw new Error('Script must have a default export')
    }

    // check if scriptModule is a Bot instance, or a class that extends Bot
    if (!(scriptModule.default.prototype instanceof Bot)) {
      throw new Error('Script must be an instance of Bot')
    }

    return (new scriptModule.default) as unknown as Bot
  }

  async run() {
    this.cli
      .name('patsabot')
      .version(version)
      .enablePositionalOptions()
      .configureHelp({
        showGlobalOptions: true,
        sortOptions: true,
        sortSubcommands: true,
      })

    this.cli
      .command('run')
      .description('Run a script')
      .argument('<script>', 'Script name')
      .argument('[args...]', 'Script arguments')
      .passThroughOptions()
      .action(async (scriptName) => {
        scriptName = scriptName.replace(/^scripts\//, "").replace(/\.ts$/, "")
        const scriptModule = await this.scriptModule(scriptName)
        scriptModule.cli
          .name('run ' + scriptName)
          .description(scriptModule.scriptDescription)

        // Ensure that we pass the global options correctly to the script
        scriptModule.cli.addOption(new Option("-l, --log-level <level>", "Log level")
          .choices(['debug', 'info', 'warn', 'error'])
          .default(this.config.logLevel)
        )
        scriptModule.cli.addOption(new Option("-c, --config <file>", "Config file")
          .default(this.config.configFile)
        )

        // Handle global options within the script
        scriptModule.cli.opts = () => ({
          logLevel: this.config.logLevel,
          configFile: this.config.configFile,
          ...scriptModule.cli.opts()
        })

        // Pass the correct arguments to parse
        scriptModule.cli.parse(process.argv.slice(2))

        scriptModule.log.defaultMeta = {
          script: scriptName,
          rid: createId(),
        }

        // Apply global log level
        if (this.config.logLevel === 'debug') {
          scriptModule.log.level = 'debug'
        }

        try {
          await scriptModule.beforeRun()
          await scriptModule.run()
        } catch (e) {
          console.error(e)
        }
        await scriptModule.afterRun()
      });

    this.cli
      .command('schedule <script>')
      .description('Schedule a script for cron')
      .option('-c, --cron <cron>', 'Cron expression')
      .addOption(new Option('-d, --date <date>', 'Date to run the script')
        .argParser((value) => {
          if (isNaN(Date.parse(value))) {
            throw new InvalidArgumentError('Invalid date. The date must be parseable by Date.parse')
          }
          if (new Date(value) < new Date()) {
            throw new InvalidArgumentError('Date must be in the future')
          }
          return new Date(value)
        }))
      .option("-i, --interval <interval>", "The minimum interval between job executions, in seconds.", (v) => {
        return parseInt(v, 10)
      })
      .showHelpAfterError()
      .action(async (scriptName, options) => {
        const scriptModule = await this.scriptModule(scriptName)
        if (options.cron === "" && !options.date || (!options.cron && !options.date)) {
          throw new Error('No schedule provided')
        }
        const pattern = options.date ? options.date as Date : options.cron as string
        await scriptModule.schedule({
          pattern: pattern,
          options: {
            interval: options.interval,
          }
        })
      })

    this.cli
      .command("replica-tunnel")
      .description("Set up an SSH tunnel to Wikimedia Replica with specific wiki database")
      .argument("<wiki>", "Wiki database name (e.g. thwiki_p, enwiki, etc.)")
      .option("-p, --port <port>", "Local port to forward to", (v) => {
        return parseInt(v, 10)
      }, 3306)
      .addOption(new Option("-c, --cluster <cluster>", "Cluster name").choices(['web', 'analytics']).default("web"))
      .action(async (wiki, options) => {
        Replica.createReplicaTunnel(wiki, options.cluster, options.port)
      })

    // Ensure that we parse the correct arguments from process.argv
    this.cli.parse()
  }
}

new ScriptRunner().run();
