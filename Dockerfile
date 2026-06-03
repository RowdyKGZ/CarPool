FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run db:push && npm run start -- --hostname 0.0.0.0"]
