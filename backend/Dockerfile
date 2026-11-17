FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install -g --ignore-scripts npm@11.6.2 && npm ci

COPY . .

EXPOSE 3000
CMD ["node", "src/server.js"]
