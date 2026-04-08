# Stage 1: base
FROM node:22-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.build.json nest-cli.json .prettierrc ./

RUN pnpm install --frozen-lockfile

# Stage 2: build
FROM deps AS builder

COPY libs/common/ ./libs/common/
COPY libs/proto/ ./libs/proto/
COPY apps/audit/ ./apps/audit/

RUN pnpm generate:audit && pnpm exec nest build audit

# Stage 3: prod
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist/apps/audit ./dist/apps/audit

EXPOSE 4010

CMD ["node", "dist/apps/audit/main.js"]
