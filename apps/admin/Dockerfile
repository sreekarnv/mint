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
COPY apps/admin/ ./apps/admin/

RUN pnpm exec nest build admin

# Stage 3: prod
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist/apps/admin ./dist/apps/admin
COPY --from=builder /app/libs/proto ./libs/proto

EXPOSE 4009

CMD ["node", "dist/apps/admin/main.js"]
