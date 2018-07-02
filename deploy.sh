#!/bin/sh
docker-compose build decorator
echo "$DOCKER_PWD" | docker login -u "$DOCKER_USER" --password-stdin
docker-compose push decorator
