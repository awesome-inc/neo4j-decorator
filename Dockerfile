FROM node:9.11.1-alpine

# cf.: https://docs.docker.com/docker-cloud/builds/advanced/#environment-variables-for-building-and-testing
#ARG SOURCE_COMMIT=unknown
ARG DOCKER_REPO
ARG CACHE_TAG
ARG IMAGE_NAME

# cf.: https://medium.com/microscaling-systems/labelling-automated-builds-on-docker-hub-f3d073fb8e1
# https://docs.docker.com/docker-cloud/builds/advanced/#override-build-test-or-push-commands
ARG VCS_REF
ARG BUILD_DATE

ARG NAME=neo4j-decorator
ARG DESCRIPTION="A decorator for the Neo4j REST Api"
ARG VENDOR="Awesome Inc"
ARG REPO=https://github.com/awesome-inc/neo4j-decorator

LABEL author="Awesome Incremented <marcel.koertgen@gmail.com>"

# cf.: http://label-schema.org/rc1/
LABEL org.label-schema.build-date="${BUILD_DATE}" \
      org.label-schema.name="${NAME}" \
      org.label-schema.description="${DESCRIPTION}" \
      org.label-schema.usage="${REPO}/blob/master/README.md" \
      org.label-schema.url="${DOCKER_REPO}" \
      org.label-schema.vcs-url="${REPO}" \
      org.label-schema.vcs-ref="${VCS_REF}" \
      org.label-schema.vendor="${VENDOR}" \
      org.label-schema.version="${CACHE_TAG}" \
      org.label-schema.schema-version="1.0" \
      org.label-schema.docker.cmd="docker run -d ${IMAGE_NAME}"
# TODO: even more labels...


RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock /usr/src/app/

ARG http_proxy=
ARG https_proxy=
RUN yarn

COPY . /usr/src/app
RUN yarn test

EXPOSE 3000

CMD [ "yarn", "start" ]
