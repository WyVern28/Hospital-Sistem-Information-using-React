FROM node:24

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN DATABASE_URL=mysql://build:build@localhost:3306/build npm run prisma:generate && npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && exec node dist/server.js"]
