import Transport from 'winston-transport';
import axios from 'axios';
import os from 'os';
import rateLimit from 'axios-rate-limit';
// @ts-ignore
const http = rateLimit(axios.create(), {
    maxRequests: 1,
    perMilliseconds: 1000,
});
/**
 * Nextabit's Discord Transport for winston
 */
export default class DiscordTransport extends Transport {
    constructor(opts) {
        super(opts);
        /** Log queue */
        this.queue = [];
        /** Helper function to retrieve url */
        this.getUrl = () => {
            return `https://discordapp.com/api/v6/webhooks/${this.id}/${this.token}`;
        };
        /**
         * Initialize the transport to fetch Discord id and token
         */
        this.initialize = () => {
            this.initialized = new Promise((resolve, reject) => {
                const opts = {
                    url: this.webhook,
                    method: 'GET',
                    json: true,
                };
                http
                    .get(opts.url)
                    .then((response) => {
                    this.id = response.data.id;
                    this.token = response.data.token;
                    resolve();
                })
                    .catch((err) => {
                    console.error(`Could not connect to Discord Webhook at ${this.webhook}`);
                    reject(err);
                });
            });
        };
        /**
         * Sends log message to discord
         */
        this.sendToDiscord = async (info) => {
            const postBody = {
                content: undefined,
                embeds: [
                    {
                        description: info.message,
                        color: DiscordTransport.COLORS[info.level],
                        fields: [],
                        timestamp: new Date().toISOString(),
                    },
                ],
            };
            if (info.level === 'error' && info.error && info.error.stack) {
                postBody.content = `\`\`\`${info.error.stack}\`\`\``;
            }
            if (this.defaultMeta) {
                Object.keys(this.defaultMeta).forEach((key) => {
                    postBody.embeds[0].fields.push({
                        name: key,
                        value: this.defaultMeta[key],
                    });
                });
            }
            if (info[Symbol.for('splat')]) {
                Object.keys(info[Symbol.for('splat')][0]).forEach((key) => {
                    postBody.embeds[0].fields.push({
                        name: key,
                        value: serailizeToList(info[Symbol.for('splat')][0][key]),
                    });
                });
            }
            function serailizeToList(obj) {
                if (typeof obj === 'string') {
                    return obj;
                }
                if (Array.isArray(obj)) {
                    return '- ' + obj.join('\n- ');
                }
                return Object.keys(obj)
                    .map((key) => {
                    return `${key}: ${obj[key]}`;
                })
                    .join('\n');
            }
            postBody.embeds[0].fields.push({
                name: 'Host',
                value: os.hostname(),
            });
            const options = {
                url: this.getUrl(),
                method: 'POST',
                json: true,
                body: postBody,
            };
            this.queue.push(options);
            try {
                // await request(options);
                await http.post(options.url, options.body, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }
            catch (err) {
                console.error('Error sending to discord', err);
            }
        };
        this.webhook = opts.webhook;
        this.defaultMeta = opts.defaultMeta || {};
        this.initialize();
    }
    /**
     * Function exposed to winston to be called when logging messages
     * @param info Log message from winston
     * @param callback Callback to winston to complete the log
     */
    log(info, callback) {
        if (info.discord !== false) {
            setImmediate(() => {
                this.initialized
                    .then(() => {
                    this.sendToDiscord(info);
                })
                    .catch((err) => {
                    console.log('Error sending message to discord', err);
                });
            });
        }
        callback();
    }
}
/** Available colors for discord messages */
DiscordTransport.COLORS = {
    error: 14362664,
    warn: 16497928,
    info: 2196944,
    verbose: 6559689,
    debug: 2196944,
    silly: 2210373, // #21ba45
};
