FROM node:9.4.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock /usr/src/app/
RUN yarn && yarn test
COPY . /usr/src/app

EXPOSE 3000

CMD [ "yarn", "run" ]
