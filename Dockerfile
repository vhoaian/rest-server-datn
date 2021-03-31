FROM node:14-stretch-slim AS build
WORKDIR /app
ENV ENVIRONMENT=DOCKER
COPY package.json /app
COPY package-lock.json /app
RUN npm install
COPY . /app

CMD [ "npm", "start" ]