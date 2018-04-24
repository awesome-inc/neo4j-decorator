FROM node:9.4.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock /usr/src/app/

ARG http_proxy=
ARG https_proxy=
RUN yarn config set proxy ${http_proxy} &&\
  yarn config set https-proxy ${https_proxy}
RUN yarn

COPY . /usr/src/app
RUN yarn test

EXPOSE 3000

CMD [ "yarn", "start" ]
