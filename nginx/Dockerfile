FROM node:latest as builder

WORKDIR /app

COPY ../app/package.json ../app/package-lock.json ./app/
COPY ../website/package.json ../website/package-lock.json ./website/

RUN cd app && npm install
RUN cd website && npm install

COPY ../app ./app
COPY ../website ./website

RUN cd app && npm run build:css && npm run build
RUN cd website && npm run build:css && npm run build

FROM nginx:latest
COPY --from=builder /app/website/build /var/www/website/build
COPY --from=builder /app/app/build /var/www/app/build

COPY ./nginx/conf /etc/nginx/conf.d