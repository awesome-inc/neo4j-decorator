#!/bin/sh
DOCKER_TAG=${TRAVIS_TAG}
IMAGE_NAME=awesomeinc/neo4j-decorator:${DOCKER_TAG}
# VCS_REF=${TRAVIS_COMMIT}
VCS_REF=`git rev-parse --short HEAD`
docker build --build-arg VCS_REF=\
 --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`\
 --build-arg DOCKER_TAG="${DOCKER_TAG}"\
 -t ${IMAGE_NAME} .
echo "$DOCKER_PWD" | docker login -u "$DOCKER_USER" --password-stdin
docker push ${IMAGE_NAME}
