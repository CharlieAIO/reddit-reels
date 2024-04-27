FROM node:21

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

RUN npm run build:css

RUN npm run build