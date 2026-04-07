FROM node:22.22.1-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

RUN pnpm install --frozen-lockfile

COPY libs/common/ ./libs/common/
COPY apps/webhook/ ./apps/webhook/

RUN pnpm run generate:webhook

EXPOSE 4008

CMD ["pnpm", "run", "dev:webhook"]
