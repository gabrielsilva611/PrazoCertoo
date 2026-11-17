FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install -g --ignore-scripts npm@11.6.2 && npm ci --ignore-scripts
RUN ./node_modules/.bin/prisma generate

COPY src ./src

USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
