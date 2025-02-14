FROM node:alpine

WORKDIR /app

COPY package.json ./

ENV NODE_ENV=production NODE_NO_WARNINGS=1

RUN npm install

COPY . .

RUN npm run deploy

ENTRYPOINT [ "npm", "start" ]