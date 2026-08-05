FROM oven/bun:1.3.12-alpine

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/core/web.ts"]
