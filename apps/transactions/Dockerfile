FROM node:22.22.1-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.build.json nest-cli.json .prettierrc ./

RUN pnpm install --frozen-lockfile

COPY libs/common/ ./libs/common/
COPY libs/proto/ libs/proto/
COPY apps/transactions/ ./apps/transactions/

EXPOSE 4003

CMD ["pnpm", "run", "dev:transactions"]