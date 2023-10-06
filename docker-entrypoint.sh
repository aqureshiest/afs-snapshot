#!/bin/bash -e

APP_NAME=$(jq -r .name package.json)
: ${APP_NAME:?}

export PATH="${PWD}/node_modules/.bin":$PATH

export NODE_ENV=${APP_ENV}

export AUTH_CLIENT_ID="null" # ${AUTH[0]}
export AUTH_CLIENT_SECRET="null" # ${AUTH[1]}

# Rundeck expects migrate as a command, but also passes this argument to the application container.
if [ "$1" == "migrate" ]; then
  yarn run migrate
else
  exec "$@"
fi
