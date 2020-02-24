FROM node:13.5.0-alpine3.10

# cf.:
# - https://docs.docker.com/docker-cloud/builds/advanced/#environment-variables-for-building-and-testing
# - https://medium.com/microscaling-systems/labelling-automated-builds-on-docker-hub-f3d073fb8e1
# - https://docs.docker.com/docker-cloud/builds/advanced/#override-build-test-or-push-commands
ARG BUILD_DATE
ARG VCS_REF
ARG DOCKER_TAG

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock ./

ARG http_proxy=
ARG https_proxy=
#RUN yarn && yarn test && rm -Rf ./node_modules
# node:11.4.0 is too recent for nunjucks (<= 11.1.0), so we ignore engines for now
RUN yarn --prod --ignore-engines

COPY . ./

ENV DECORATOR_CONFIG /etc/decorator
COPY config/ ${DECORATOR_CONFIG}

EXPOSE 3000

CMD [ "yarn", "start" ]

# cf.: http://label-schema.org/rc1/
LABEL author="Awesome Incremented <marcel.koertgen@gmail.com>"\
  org.label-schema.build-date="${BUILD_DATE}" \
  org.label-schema.name="awesomeinc/neo4j-decorator" \
  org.label-schema.description="A decorator for the Neo4j REST Api." \
  org.label-schema.usage="https://github.com/awesome-inc/neo4j-decorator/blob/master/README.md" \
  org.label-schema.url="https://hub.docker.com/r/awesomeinc/neo4j-decorator" \
  org.label-schema.vcs-url="https://github.com/awesome-inc/neo4j-decorator" \
  org.label-schema.vcs-ref="${VCS_REF}" \
  org.label-schema.vendor="Awesome Inc" \
  org.label-schema.version="${DOCKER_TAG}" \
  org.label-schema.schema-version="1.0" \
  org.label-schema.docker.cmd="docker run awesomeinc/neo4j-decorator:${DOCKER_TAG}"
# TODO: even more labels...
