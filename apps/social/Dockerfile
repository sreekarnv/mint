FROM node:22.22.1-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

RUN pnpm install --frozen-lockfile

COPY libs/common/ ./libs/common/
COPY apps/social/ ./apps/social/

RUN pnpm run generate:social

EXPOSE 4007

CMD ["pnpm", "run", "dev:social"]
