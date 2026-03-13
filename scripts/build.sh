#!/bin/bash

SERVICE=""
TAG=""

# parse parameters
while [[ $# -gt 0 ]]; do
  case $1 in
    -s|--service)
      SERVICE="$2"
      shift 2
      ;;
    -t|--tag)
      TAG="$2"
      shift 2
      ;;
    *)
      echo "Error: unknown argument '$1'" >&2
      exit 1
      ;;
  esac
done

# check required parameters
if [[ -z "$SERVICE" ]]; then
  echo "Error: missing required parameter -s/--service" >&2
  exit 1
fi

if [[ -z "$TAG" ]]; then
  echo "Error: missing required parameter -t/--tag" >&2
  exit 1
fi

# execute command with parameters
docker build \
  --add-host=host.docker.internal:host-gateway \
  -f services/$SERVICE/Dockerfile \
  -t $TAG:latest .

docker save $TAG -o $TAG.tar
