declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
      PORT: string;
      DATABASE_URL: string;
      NODE_ENV: "development" | "production";
      HOOK_SECRET: string;

      BOT_USERNAME: string;
      BOT_CONTACT: string;
      BOT_PASSWORD: string;

      BOT_CONTROL_API_ACCESS_TOKEN: string;

      BOT_CONSUMER_TOKEN: string;
      BOT_CONSUMER_SECRET: string;
      BOT_ACCESS_TOKEN: string;
      BOT_ACCESS_SECRET: string;

      BOT_API_URL: string;

      BOT_REPLICA_HOST: string;
      BOT_REPLICA_PORT: string;
      BOT_REPLICA_USERNAME: string;
      BOT_REPLICA_PASSWORD: string;
      BOT_REPLICA_DATABASE: string;

      BOT_IRC_NICKNAME: string;
      BOT_IRC_USERNAME: string;
      BOT_IRC_PASSWORD: string;
      BOT_IRC_SERVER: string;
      BOT_IRC_PORT: string;

      BOT_DISCORD_WEBHOOK_LOGGER: string;

      BOT_SCRIPT_ARCHIVE_KEY_SALT: string;

      // Tools provided
      TOOL_DATA_DIR: string;
    }
  }
}

export {};
