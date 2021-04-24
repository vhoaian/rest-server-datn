FROM node:14-stretch-slim

WORKDIR /app
ENV ENVIRONMENT=PRODUCTION
ENV MONGO_DB=mongodb://mongo:27018/nowDB
COPY package.json /app
COPY package-lock.json /app
RUN npm install
COPY . /app

CMD [ "npm", "start" ]