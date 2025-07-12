FROM oven/bun:1.2.10

WORKDIR /app

COPY bun.lock package.json vite.config.* tsconfig.* ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

CMD ["bun", "run", "preview"]