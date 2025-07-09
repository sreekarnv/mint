FROM oven/bun:latest

WORKDIR /app

COPY package.json ./package.json
COPY bun.lock ./bun.lock

RUN bun install

COPY . .

CMD ["bun", "dev"]
