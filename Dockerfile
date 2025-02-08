FROM node:alpine

WORKDIR /app

COPY . .

ENV NODE_ENV=production NODE_NO_WARNINGS=1

RUN npm install && npm run deploy

ENTRYPOINT [ "npm", "start" ]