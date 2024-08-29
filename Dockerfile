FROM node:alpine

WORKDIR /app

COPY . .

ENV NODE_ENV=production

RUN npm install && npm run deploy

ENTRYPOINT [ "npm", "start" ]