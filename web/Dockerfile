FROM node:20-alpine3.19 AS builder

WORKDIR /app

RUN apk update && apk upgrade

COPY package.json yarn.lock ./
COPY tsconfig.json ./
COPY next.config.ts ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:20-alpine3.19 AS runner

WORKDIR /app

RUN apk update && apk upgrade

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN yarn install --production --frozen-lockfile

EXPOSE 3000

CMD ["yarn", "start"]
