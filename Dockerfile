FROM oven/bun:1.3.12-alpine

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

COPY . .

EXPOSE 3000

# CONFIG_TOML_B64, if set, is decoded to config.toml before startup — lets a
# host inject credentials via an env var instead of baking config.toml into
# the image (config.toml itself is gitignored and never copied in above).
CMD ["sh", "-c", "if [ -n \"$CONFIG_TOML_B64\" ]; then echo \"$CONFIG_TOML_B64\" | base64 -d > config.toml; fi; exec bun run src/core/web.ts"]
